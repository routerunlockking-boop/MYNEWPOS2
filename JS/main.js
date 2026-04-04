/**
 * Smart Zone LK - Main Application Entry Point
 * Initializes all modules and handles global events
 */

const App = {
  init() {
    console.log('🔷 Smart Zone LK - Initializing...');
    
    // Initialize all modules
    DB.init();
    Navigation.init();
    Products.renderFeaturedProducts();
    DB.updateCartBadge();
    Auth.init();
    Checkout.init();
    Admin.init();
    
    // Setup shop filters
    this.setupShopFilters();
    
    // Setup thumb click handlers for product detail
    this.setupThumbClicks();
    
    console.log('✅ Smart Zone LK - Ready!');
  },

  // Setup shop filter checkboxes
  setupShopFilters() {
    const checkboxes = document.querySelectorAll('.shop-sidebar input[type="checkbox"]');
    const applyPriceBtn = document.getElementById('applyPriceBtn');
    const sortSelect = document.getElementById('sortSelect');

    checkboxes.forEach(cb => {
      cb.addEventListener('change', () => this.applyFilters());
    });

    if (applyPriceBtn) {
      applyPriceBtn.addEventListener('click', () => this.applyFilters());
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', () => this.applyFilters());
    }
  },

  // Apply all shop filters
  applyFilters() {
    const products = DB.getProducts();
    let filtered = [...products];
    
    // Category filter
    const categories = [];
    if (document.getElementById('cat-home')?.checked) categories.push('Home Routers');
    if (document.getElementById('cat-gaming')?.checked) categories.push('Gaming Routers');
    if (document.getElementById('cat-mesh')?.checked) categories.push('Mesh Systems');
    if (document.getElementById('cat-enterprise')?.checked) categories.push('Enterprise');
    if (document.getElementById('cat-accessories')?.checked) categories.push('Accessories');
    
    if (categories.length > 0 && !document.getElementById('cat-all')?.checked) {
      filtered = filtered.filter(p => categories.includes(p.category));
    }
    
    // Brand filter
    const brands = [];
    if (document.getElementById('brand-tp')?.checked) brands.push('TP-Link');
    if (document.getElementById('brand-asus')?.checked) brands.push('ASUS');
    if (document.getElementById('brand-huawei')?.checked) brands.push('Huawei');
    if (document.getElementById('brand-xiaomi')?.checked) brands.push('Xiaomi');
    if (document.getElementById('brand-netgear')?.checked) brands.push('Netgear');
    if (document.getElementById('brand-mercusys')?.checked) brands.push('Mercusys');
    
    if (brands.length > 0) {
      filtered = filtered.filter(p => brands.includes(p.brand));
    }
    
    // WiFi filter
    const wifiFilters = [];
    if (document.getElementById('wifi-6e')?.checked) wifiFilters.push('WiFi 6E');
    if (document.getElementById('wifi-6')?.checked) wifiFilters.push('WiFi 6');
    if (document.getElementById('wifi-5')?.checked) wifiFilters.push('WiFi 5');
    
    if (wifiFilters.length > 0) {
      filtered = filtered.filter(p => wifiFilters.includes(p.wifi));
    }
    
    // Price filter
    const minPrice = parseInt(document.getElementById('priceMin')?.value) || 0;
    const maxPrice = parseInt(document.getElementById('priceMax')?.value) || 999999;
    filtered = filtered.filter(p => {
      const price = p.salePrice || p.price;
      return price >= minPrice && price <= maxPrice;
    });
    
    // Sort
    const sort = document.getElementById('sortSelect')?.value || 'featured';
    switch(sort) {
      case 'price-low': filtered.sort((a,b) => (a.salePrice||a.price) - (b.salePrice||b.price)); break;
      case 'price-high': filtered.sort((a,b) => (b.salePrice||b.price) - (a.salePrice||a.price)); break;
      case 'name-az': filtered.sort((a,b) => a.name.localeCompare(b.name)); break;
      case 'rating': filtered.sort((a,b) => b.rating - a.rating); break;
    }
    
    Products.renderShopProducts(filtered);
  },

  // Setup thumbnail click handlers
  setupThumbClicks() {
    document.addEventListener('click', (e) => {
      const thumb = e.target.closest('.thumb');
      if (thumb) {
        thumb.parentElement.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      }
    });
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());

// Make functions globally accessible for inline handlers
window.Products = Products;
window.Cart = Cart;
window.Checkout = Checkout;
window.Auth = Auth;
window.Admin = Admin;
window.DB = DB;
window.App = App;