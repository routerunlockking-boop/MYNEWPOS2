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
                navigateTo('home');
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
    if (!btn) return;
    
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      const email = document.getElementById('portalEmail').value.trim();
      const password = document.getElementById('portalPassword').value.trim();
      
      if (!email || !password) {
        DB.showToast('Error', 'Please fill in all required fields.', 'error');
        return;
      }

      if (mode === 'login') {
        // Admin login check
        if(email === 'smartzonelk101@gmail.com' && password === '200723800385@') {
            const adminUser = { name: 'Admin User', email: 'smartzonelk101@gmail.com', phone: '', role: 'admin' };
            localStorage.setItem('sz_user', JSON.stringify(adminUser));
            DB.showToast('Admin Login', 'Welcome back, Admin!', 'success');
            this.updateAuthUI();
            
            // Clear fields
            document.getElementById('portalPassword').value = '';
            
            navigateTo('admin');
            return;
        }

        // Customer login check
        const customers = DB.getCustomers();
        const customer = customers.find(c => c.email === email);
        if (customer) {
            localStorage.setItem('sz_user', JSON.stringify(customer));
            DB.showToast('Welcome Back!', 'You have signed in successfully.', 'success');
            this.updateAuthUI();
            
            // Clear fields
            document.getElementById('portalPassword').value = '';
            
            navigateTo('home');
        } else {
            DB.showToast('Error', 'Invalid email or password.', 'error');
        }
        
      } else {
        // Register Mode
        const name = document.getElementById('portalName').value.trim();
        const phone = document.getElementById('portalPhone').value.trim();
        
        if (!name || !phone) {
          DB.showToast('Error', 'Please fill in all fields.', 'error');
          return;
        }

        const customers = DB.getCustomers();
        if (customers.find(c => c.email === email)) {
            DB.showToast('Error', 'Email already exists.', 'error');
            return;
        }

        const newCustomer = { name, email, phone, orders: 0, totalSpent: 0, registered: new Date().toISOString().split('T')[0] };
        customers.push(newCustomer);
        localStorage.setItem('sz_customers', JSON.stringify(customers));
        localStorage.setItem('sz_user', JSON.stringify(newCustomer));

        DB.showToast('Account Created!', 'Welcome to Smart Zone LK!', 'success');
        this.updateAuthUI();
        
        // Clear fields
        ['portalName', 'portalPhone', 'portalEmail', 'portalPassword'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        
        navigateTo('home');
      }
    });
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => Auth.init());