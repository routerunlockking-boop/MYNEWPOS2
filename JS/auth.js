/**
 * Smart Zone LK - Auth Module
 * Handles customer authentication (login/register)
 */

const Auth = {
  init() {
    this.updateAuthUI();
    this.setupModalClose();
    this.setupLoginSubmit();
    this.setupRegisterSubmit();
    this.setupAuthSwitch();
    this.setupSocialLogins();
  },

  // Setup account button
  setupAccountButton() {
    // Legacy mapping (now handled in updateAuthUI)
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
            }
        });
    } else {
        newBtn.innerHTML = '<i class="fas fa-user"></i>';
        newBtn.title = 'Account';
        newBtn.addEventListener('click', () => this.openModal('login'));
    }
  },

  // Open auth modal
  openModal(type) {
    document.getElementById('authModal').classList.add('active');
    this.toggleForm(type);
  },

  // Close auth modal
  closeModal() {
    document.getElementById('authModal').classList.remove('active');
  },

  // Setup modal close
  setupModalClose() {
    const closeBtn = document.getElementById('authCloseBtn');
    const overlay = document.getElementById('authModal');
    
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeModal();
      });
    }
  },

  // Toggle between login and register forms
  toggleForm(type) {
    if (type === 'login') {
      document.getElementById('loginForm').style.display = 'block';
      document.getElementById('registerForm').style.display = 'none';
      document.getElementById('authTitle').textContent = 'Sign In';
      document.getElementById('authSwitch').innerHTML = 'Don\\'t have an account? <a href="#" id="showRegisterLink">Sign Up</a>';
    } else {
      document.getElementById('loginForm').style.display = 'none';
      document.getElementById('registerForm').style.display = 'block';
      document.getElementById('authTitle').textContent = 'Create Account';
      document.getElementById('authSwitch').innerHTML = 'Already have an account? <a href="#" id="showLoginLink">Sign In</a>';
    }
    this.setupAuthSwitch();
  },

  // Setup auth form switching
  setupAuthSwitch() {
    const registerLink = document.getElementById('showRegisterLink');
    const loginLink = document.getElementById('showLoginLink');
    
    if (registerLink) {
      registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleForm('register');
      });
    }
    if (loginLink) {
      loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleForm('login');
      });
    }
  },

  // Setup login submit
  setupLoginSubmit() {
    const btn = document.getElementById('loginSubmitBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        if (!email || !password) {
          DB.showToast('Error', 'Please fill in all fields.', 'error');
          return;
        }
        
        // Demo admin login bypassing db check
        if(email === 'admin@smartzonelk.com' && password === 'admin123') {
            const adminUser = { name: 'Admin User', email: 'admin@smartzonelk.com', phone: '', role: 'admin' };
            localStorage.setItem('sz_user', JSON.stringify(adminUser));
            DB.showToast('Admin Login', 'Welcome back, Admin!', 'success');
            this.updateAuthUI();
            this.closeModal();
            Navigation.navigateTo('admin');
            return;
        }

        const customers = DB.getCustomers();
        const customer = customers.find(c => c.email === email);
        if (customer) {
            localStorage.setItem('sz_user', JSON.stringify(customer));
            DB.showToast('Welcome Back!', 'You have signed in successfully.', 'success');
            this.updateAuthUI();
            this.closeModal();
        } else {
            DB.showToast('Error', 'Invalid email or password.', 'error');
        }
      });
    }
  },

  // Setup register submit
  setupRegisterSubmit() {
    const btn = document.getElementById('registerSubmitBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const password = document.getElementById('regPassword').value.trim();
        if (!name || !email || !phone || !password) {
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
        this.closeModal();
      });
    }
  },

  // Setup social login buttons
  setupSocialLogins() {
    const googleBtn = document.getElementById('googleLoginBtn');
    const phoneBtn = document.getElementById('phoneLoginBtn');
    
    if (googleBtn) googleBtn.addEventListener('click', () => DB.showToast('Google Sign-In', 'Feature coming soon!', 'info'));
    if (phoneBtn) phoneBtn.addEventListener('click', () => DB.showToast('Phone Login', 'Feature coming soon!', 'info'));
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => Auth.init());