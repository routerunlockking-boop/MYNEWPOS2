/**
 * Smart Zone LK - Navigation Module
 * Handles page routing, mobile menu, and navigation events
 */

const Navigation = {
  currentPage: 'home',

  init() {
    this.setupNavigationLinks();
    this.setupMobileMenu();
    this.setupSearch();
    this.setupNewsletter();
    this.setupContactForm();
  },

  // Navigate to a specific page
  navigateTo(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Show target page
    const targetPage = document.getElementById('page-' + page);
    if (targetPage) {
      targetPage.classList.add('active');
    }
    
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll(`.nav-link[data-nav="${page}"]`).forEach(l => l.classList.add('active'));
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    this.currentPage = page;

    // Trigger page-specific renders
    this.triggerPageRender(page);
  },

  // Trigger renders based on current page
  triggerPageRender(page) {
    switch(page) {
      case 'home':
        Products.renderFeaturedProducts();
        break;
      case 'shop':
        Products.renderShopProducts();
        break;
      case 'cart':
        Cart.renderCart();
        break;
      case 'checkout':
        Checkout.renderCheckoutSummary();
        break;
      case 'admin':
        Admin.renderDashboard();
        break;
    }
  },

  // Setup all navigation event listeners
  setupNavigationLinks() {
    // Main nav links
    document.querySelectorAll('[data-nav]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-nav');
        this.navigateTo(page);
        // Close mobile nav if open
        document.getElementById('mobileNav').classList.remove('active');
      });
    });

    // Category filter links
    document.querySelectorAll('[data-filter]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const category = link.getAttribute('data-filter');
        this.filterByCategory(category);
        document.getElementById('mobileNav').classList.remove('active');
      });
    });

    // Admin nav
    document.querySelectorAll('[data-admin]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.getAttribute('data-admin');
        Admin.showSection(section);
      });
    });
  },

  // Setup mobile menu
  setupMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    const closeBtn = document.getElementById('mobileNavClose');

    if (menuBtn) menuBtn.addEventListener('click', () => mobileNav.classList.add('active'));
    if (closeBtn) closeBtn.addEventListener('click', () => mobileNav.classList.remove('active'));
  },

  // Setup search
  setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    if (searchInput) {
      searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') this.performSearch();
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.performSearch());
    }
  },

  performSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!query) { this.navigateTo('shop'); return; }
    
    const products = DB.getProducts();
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.brand.toLowerCase().includes(query) || 
      p.category.toLowerCase().includes(query) ||
      (p.wifi && p.wifi.toLowerCase().includes(query))
    );

    document.getElementById('shopTitle').textContent = `Search: "${query}"`;
    document.getElementById('shopSubtitle').textContent = `${filtered.length} results found`;
    document.getElementById('shopBreadcrumb').textContent = 'Search Results';
    
    this.navigateTo('shop');
    Products.renderShopProducts(filtered);
  },

  // Filter products by category
  filterByCategory(category) {
    const products = DB.getProducts();
    const filtered = products.filter(p => p.category === category);
    
    document.getElementById('shopTitle').textContent = category;
    document.getElementById('shopSubtitle').textContent = `${filtered.length} products in ${category}`;
    document.getElementById('shopBreadcrumb').textContent = category;
    
    this.navigateTo('shop');
    Products.renderShopProducts(filtered);
  },

  // Setup newsletter
  setupNewsletter() {
    const btn = document.getElementById('newsletterBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        const email = document.getElementById('newsletterEmail').value.trim();
        if (email && email.includes('@')) {
          DB.showToast('Subscribed!', 'You will receive our latest deals.', 'success');
          document.getElementById('newsletterEmail').value = '';
        } else {
          DB.showToast('Invalid Email', 'Please enter a valid email address.', 'error');
        }
      });
    }
  },

  // Setup contact form
  setupContactForm() {
    const btn = document.getElementById('sendMessageBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        DB.showToast('Message Sent!', 'We will get back to you within 24 hours.', 'success');
      });
    }
  }
};

// Make filterByCategory globally accessible for inline onclick handlers
window.filterByCategory = (category) => Navigation.filterByCategory(category);
window.navigateTo = (page) => Navigation.navigateTo(page);

// Initialize
document.addEventListener('DOMContentLoaded', () => Navigation.init());