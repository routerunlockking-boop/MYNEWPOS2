/**
 * Smart Zone LK - Auth Module
 * Handles customer & admin authentication via Unified Portal
 */

const Auth = {
  init() {
    this.updateAuthUI();
    this.setupPortalSwitch();
    this.setupPortalSubmit();
  },

  // Update UI based on authentication status
  updateAuthUI() {
    const userStr = localStorage.getItem('sz_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const accountBtn = document.getElementById('accountBtn');
    
    if (!accountBtn) return;
    
    // Remove old listeners
    const newBtn = accountBtn.cloneNode(true);
    accountBtn.parentNode.replaceChild(newBtn, accountBtn);
    
    if (user) {
        newBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
        newBtn.title = 'Logout (' + user.name + ')';
        newBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to log out?')) {
                localStorage.removeItem('sz_user');
                DB.showToast('Logged Out', 'You have been logged out successfully.', 'info');
                this.updateAuthUI();
                // Use proper navigation
                if (typeof Navigation !== 'undefined' && Navigation.navigateTo) {
                  Navigation.navigateTo('home');
                } else if (typeof navigateTo === 'function') {
                  navigateTo('home');
                } else {
                  window.location.hash = '#home';
                }
            }
        });
    } else {
        newBtn.innerHTML = '<i class="fas fa-user"></i>';
        newBtn.title = 'Account';
        newBtn.addEventListener('click', () => this.openPortal('login'));
    }
  },

  // Open auth portal
  openPortal(type) {
    navigateTo('login');
    this.togglePortalMode(type);
  },

  openModal(type) {
    // Legacy support for checkout.js calling openModal
    this.openPortal(type);
  },

  // Toggle between login and register modes in portal
  togglePortalMode(type) {
    const title = document.getElementById('portalTitle');
    const subtitle = document.getElementById('portalSubtitle');
    const regFields = document.getElementById('portalRegFields');
    const rememberDiv = document.getElementById('portalRememberDiv');
    const submitBtn = document.getElementById('portalSubmitBtn');
    const switchText = document.getElementById('portalSwitchText');
    
    if (!title) return;

    if (type === 'login') {
      title.textContent = 'Sign In';
      subtitle.textContent = 'Access your account or admin dashboard';
      regFields.style.display = 'none';
      rememberDiv.style.display = 'flex';
      submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
      submitBtn.dataset.mode = 'login';
      switchText.innerHTML = "Don't have an account? <a href=\"#\" id=\"portalSwitchLink\" style=\"color:var(--primary);font-weight:600;\">Sign Up</a>";
    } else {
      title.textContent = 'Create Account';
      subtitle.textContent = 'Join Smart Zone LK today';
      regFields.style.display = 'block';
      rememberDiv.style.display = 'none';
      submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Register';
      submitBtn.dataset.mode = 'register';
      switchText.innerHTML = 'Already have an account? <a href="#" id="portalSwitchLink" style="color:var(--primary);font-weight:600;">Sign In</a>';
    }
    
    // Re-bind the switch link
    const newLink = document.getElementById('portalSwitchLink');
    if (newLink) {
      newLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.togglePortalMode(type === 'login' ? 'register' : 'login');
      });
    }
  },

  setupPortalSwitch() {
    this.togglePortalMode('login'); // Default state
  },

  // Setup unified portal submit
  setupPortalSubmit() {
    const btn = document.getElementById('portalSubmitBtn');
    if (!btn) {
      console.error('Auth: Submit button not found');
      return;
    }
    
    btn.addEventListener('click', () => {
      console.log('Auth: Login button clicked');
      const mode = btn.dataset.mode || 'login';
      const email = document.getElementById('portalEmail')?.value.trim() || '';
      const password = document.getElementById('portalPassword')?.value.trim() || '';
      
      console.log('Auth: Attempting login - Mode:', mode, 'Email:', email);
      
      if (!email || !password) {
        DB.showToast('Error', 'Please fill in all required fields.', 'error');
        return;
      }

      if (mode === 'login') {
        // Admin login check
        if(email === 'smartzonelk101@gmail.com' && password === '200723800385@') {
            console.log('Auth: Admin login successful');
            const adminUser = { name: 'Admin User', email: 'smartzonelk101@gmail.com', phone: '', role: 'admin' };
            localStorage.setItem('sz_user', JSON.stringify(adminUser));
            DB.showToast('Admin Login', 'Welcome back, Admin!', 'success');
            this.updateAuthUI();
            
            // Clear fields
            const passwordField = document.getElementById('portalPassword');
            if (passwordField) passwordField.value = '';
            
            // Use proper navigation
            if (typeof Navigation !== 'undefined' && Navigation.navigateTo) {
              Navigation.navigateTo('admin');
            } else if (typeof navigateTo === 'function') {
              navigateTo('admin');
            } else {
              console.error('Auth: Navigation function not available');
              window.location.hash = '#admin';
            }
            return;
        }

        // Customer login check
        const customers = DB.getCustomers();
        console.log('Auth: Checking customer login, available customers:', customers.length);
        const customer = customers.find(c => c.email === email);
        if (customer) {
            console.log('Auth: Customer login successful for:', customer.name);
            localStorage.setItem('sz_user', JSON.stringify(customer));
            DB.showToast('Welcome Back!', 'You have signed in successfully.', 'success');
            this.updateAuthUI();
            
            // Clear fields
            const passwordField = document.getElementById('portalPassword');
            if (passwordField) passwordField.value = '';
            
            // Use proper navigation
            if (typeof Navigation !== 'undefined' && Navigation.navigateTo) {
              Navigation.navigateTo('home');
            } else if (typeof navigateTo === 'function') {
              navigateTo('home');
            } else {
              console.error('Auth: Navigation function not available');
              window.location.hash = '#home';
            }
        } else {
            console.log('Auth: Customer login failed - email not found:', email);
            DB.showToast('Error', 'Invalid email or password.', 'error');
        }
        
      } else {
        // Register Mode
        const name = document.getElementById('portalName')?.value.trim() || '';
        const phone = document.getElementById('portalPhone')?.value.trim() || '';
        
        console.log('Auth: Attempting registration - Name:', name, 'Email:', email);
        
        if (!name || !phone) {
          DB.showToast('Error', 'Please fill in all fields.', 'error');
          return;
        }

        const customers = DB.getCustomers();
        if (customers.find(c => c.email === email)) {
            console.log('Auth: Registration failed - email already exists:', email);
            DB.showToast('Error', 'Email already exists.', 'error');
            return;
        }

        const newCustomer = { name, email, phone, orders: 0, totalSpent: 0, registered: new Date().toISOString().split('T')[0] };
        customers.push(newCustomer);
        localStorage.setItem('sz_customers', JSON.stringify(customers));
        localStorage.setItem('sz_user', JSON.stringify(newCustomer));

        console.log('Auth: Registration successful for:', newCustomer.name);
        DB.showToast('Account Created!', 'Welcome to Smart Zone LK!', 'success');
        this.updateAuthUI();
        
        // Clear fields
        ['portalName', 'portalPhone', 'portalEmail', 'portalPassword'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        
        // Use proper navigation
        if (typeof Navigation !== 'undefined' && Navigation.navigateTo) {
          Navigation.navigateTo('home');
        } else if (typeof navigateTo === 'function') {
          navigateTo('home');
        } else {
          console.error('Auth: Navigation function not available');
          window.location.hash = '#home';
        }
      }
    });
  },

  // Emergency admin access - call from console: Auth.emergencyAdminLogin()
  emergencyAdminLogin() {
    console.log('Auth: Emergency admin login triggered');
    const adminUser = { name: 'Admin User', email: 'smartzonelk101@gmail.com', phone: '', role: 'admin' };
    localStorage.setItem('sz_user', JSON.stringify(adminUser));
    DB.showToast('Emergency Access', 'Admin access granted!', 'success');
    this.updateAuthUI();
    
    if (typeof Navigation !== 'undefined' && Navigation.navigateTo) {
      Navigation.navigateTo('admin');
    } else if (typeof navigateTo === 'function') {
      navigateTo('admin');
    } else {
      window.location.hash = '#admin';
      location.reload();
    }
  },

  // Debug function to check auth status
  debugAuthStatus() {
    const userStr = localStorage.getItem('sz_user');
    const user = userStr ? JSON.parse(userStr) : null;
    console.log('Auth Status Debug:', {
      isLoggedIn: !!user,
      userInfo: user,
      customersAvailable: DB.getCustomers().length,
      navigationAvailable: typeof Navigation !== 'undefined',
      globalNavigateTo: typeof navigateTo !== 'undefined'
    });
    return user;
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('Auth: Initializing auth module');
  Auth.init();
  
  // Make emergency functions available globally
  window.Auth = Auth;
  console.log('Auth: Emergency functions available - call Auth.emergencyAdminLogin() or Auth.debugAuthStatus()');
});
