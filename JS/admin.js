/**
 * Smart Zone LK - Admin Module
 * Handles admin dashboard functionality
 */

const Admin = {
  isLoggedIn: false,
  editingProductId: null,

  init() {
    this.setupAdminLogin();
    this.setupAdminLogout();
    this.setupSaveProduct();
    this.setupClearForm();
    this.setupOrderConfirmModal();
  },

  // Show admin section
  showSection(section) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.admin-nav-item').forEach(n => n.classList.remove('active'));
    
    // Show target section
    const target = document.getElementById('admin-' + section);
    if (target) target.style.display = 'block';
    
    // Highlight nav item
    document.querySelectorAll(`.admin-nav-item[data-admin="${section}"]`).forEach(n => n.classList.add('active'));
    
    // Render section data
    switch(section) {
      case 'dashboard': this.renderDashboard(); break;
      case 'products': this.renderProducts(); break;
      case 'orders': this.renderOrders(); break;
      case 'customers': this.renderCustomers(); break;
      case 'add-product': this.clearProductForm(); break;
    }
  },

  // Admin login
  setupAdminLogin() {
    // Handled by Auth.js unified portal
  },

  // Admin logout
  setupAdminLogout() {
    const btn = document.getElementById('adminLogoutBtn');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.isLoggedIn = false;
        Navigation.navigateTo('login');
        DB.showToast('Logged Out', 'You have been logged out.', 'info');
      });
    }
  },

  // Render dashboard
  renderDashboard() {
    const orders = DB.getOrders();
    const products = DB.getProducts();
    
    // Update stats
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const revenueEl = document.getElementById('statRevenue');
    const ordersEl = document.getElementById('statOrders');
    const productsEl = document.getElementById('statProducts');
    
    if (revenueEl) revenueEl.textContent = DB.formatLKR(totalRevenue);
    if (ordersEl) ordersEl.textContent = orders.length;
    if (productsEl) productsEl.textContent = products.length;
    
    // Sales chart
    this.renderSalesChart();
    
    // Recent orders
    const recent = orders.slice(-5).reverse();
    const recentBody = document.getElementById('recentOrdersBody');
    if (recentBody) {
      recentBody.innerHTML = recent.map(o => `
        <tr>
          <td><strong>${o.id}</strong></td>
          <td>${o.customer}</td>
          <td>${DB.formatLKR(o.total)}</td>
          <td><span class="status-badge status-${o.status}">${o.status.charAt(0).toUpperCase() + o.status.slice(1)}</span></td>
          <td>${o.date}</td>
        </tr>
      `).join('');
    }
    
    // Low stock alerts
    const lowStock = products.filter(p => p.stock <= 10);
    const lowStockBody = document.getElementById('lowStockBody');
    if (lowStockBody) {
      lowStockBody.innerHTML = lowStock.length 
        ? lowStock.map(p => `
            <tr>
              <td>${p.name}</td>
              <td>SKU-${p.id.toString().padStart(4,'0')}</td>
              <td><strong style="color:${p.stock <= 5 ? 'var(--danger)' : 'var(--warning)'};">${p.stock}</strong></td>
              <td><span class="status-badge ${p.stock <= 5 ? 'status-cancelled' : 'status-pending'}">${p.stock <= 5 ? 'Critical' : 'Low'}</span></td>
            </tr>
          `).join('')
        : '<tr><td colspan="4" style="text-align:center;color:var(--gray-500);">All products well stocked ✓</td></tr>';
    }
  },

  // Render sales chart
  renderSalesChart() {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const salesData = [12,19,8,15,22,18,25,30,28,35,20,15];
    const maxVal = Math.max(...salesData);
    
    const chartBars = document.getElementById('chartBars');
    if (chartBars) {
      chartBars.innerHTML = salesData.map((val, i) => 
        `<div class="chart-bar" style="height:${(val/maxVal)*100}%"><span class="bar-value">${val}</span><span class="bar-label">${months[i]}</span></div>`
      ).join('');
    }
  },

  // Render products table
  renderProducts() {
    const products = DB.getProducts();
    const body = document.getElementById('adminProductsBody');
    if (body) {
      body.innerHTML = products.map(p => `
        <tr>
          <td><strong>${p.name}</strong></td>
          <td>${p.brand}</td>
          <td>${p.category}</td>
          <td>${p.salePrice ? `<span style="text-decoration:line-through;color:var(--gray-400);">${DB.formatLKR(p.price)}</span> ${DB.formatLKR(p.salePrice)}` : DB.formatLKR(p.price)}</td>
          <td><strong style="color:${p.stock <= 10 ? 'var(--danger)' : 'var(--success)'};">${p.stock}</strong></td>
          <td><span class="status-badge ${p.stock > 0 ? 'status-delivered' : 'status-cancelled'}">${p.stock > 0 ? 'Active' : 'Out of Stock'}</span></td>
          <td>
            <div class="action-btns">
              <button class="action-btn" onclick="Admin.editProduct(${p.id})" title="Edit"><i class="fas fa-edit"></i></button>
              <button class="action-btn delete" onclick="Admin.deleteProduct(${p.id})" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `).join('');
    }
  },

  // Render orders table
  renderOrders() {
    const orders = DB.getOrders();
    const body = document.getElementById('adminOrdersBody');
    if (body) {
      body.innerHTML = orders.map(o => `
        <tr>
          <td><strong>${o.id}</strong></td>
          <td>${o.customer}</td>
          <td>${o.items.length} item(s)</td>
          <td>${DB.formatLKR(o.total)}</td>
          <td style="text-transform:uppercase;">${o.payment}</td>
          <td>
            <select class="sort-select" style="padding:6px 10px;font-size:0.8rem;" onchange="Admin.updateOrderStatus('${o.id}', this.value)">
              <option value="pending" ${o.status==='pending'?'selected':''}>Pending</option>
              <option value="confirmed" ${o.status==='confirmed'?'selected':''}>Confirmed</option>
              <option value="processing" ${o.status==='processing'?'selected':''}>Processing</option>
              <option value="shipped" ${o.status==='shipped'?'selected':''}>Shipped</option>
              <option value="delivered" ${o.status==='delivered'?'selected':''}>Delivered</option>
              <option value="cancelled" ${o.status==='cancelled'?'selected':''}>Cancelled</option>
            </select>
          </td>
          <td>${o.date}</td>
          <td>
            <div class="action-btns">
              <button class="action-btn" onclick="Admin.viewOrderDetail('${o.id}')" title="View"><i class="fas fa-eye"></i></button>
              <button class="action-btn" onclick="Admin.manageTracking('${o.id}')" title="Manage Tracking"><i class="fas fa-truck"></i></button>
            </div>
          </td>
        </tr>
      `).join('');
    }
  },

  // Render customers table
  renderCustomers() {
    const customers = DB.getCustomers();
    const body = document.getElementById('adminCustomersBody');
    if (body) {
      body.innerHTML = customers.map(c => `
        <tr>
          <td><strong>${c.name}</strong></td>
          <td>${c.email}</td>
          <td>${c.phone}</td>
          <td>${c.orders}</td>
          <td>${DB.formatLKR(c.totalSpent)}</td>
          <td>${c.registered}</td>
          <td>
            <button class="action-btn delete" onclick="Admin.deleteCustomer('${c.email}')" title="Delete"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `).join('');
    }
  },

  showAddCustomerModal() {
    const modal = document.getElementById('addCustomerModal');
    if (modal) modal.classList.add('active');
  },

  hideAddCustomerModal() {
    const modal = document.getElementById('addCustomerModal');
    if (modal) {
      modal.classList.remove('active');
      document.getElementById('addCustomerForm').reset();
    }
  },

  saveNewCustomer(e) {
    e.preventDefault();
    const name = document.getElementById('newCustomerName').value.trim();
    const email = document.getElementById('newCustomerEmail').value.trim();
    const phone = document.getElementById('newCustomerPhone').value.trim();
    
    if (!name || !email || !phone) return;
    
    const customers = DB.getCustomers();
    
    if (customers.find(c => c.email.toLowerCase() === email.toLowerCase())) {
        DB.showToast('Error', 'Customer with this email already exists', 'error');
        return;
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    customers.push({
        name,
        email,
        phone,
        orders: 0,
        totalSpent: 0,
        registered: `${yyyy}-${mm}-${dd}`
    });

    localStorage.setItem('sz_customers', JSON.stringify(customers));
    this.hideAddCustomerModal();
    this.renderCustomers();
    DB.showToast('Success', 'Customer added successfully', 'success');
  },

  deleteCustomer(email) {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    let customers = DB.getCustomers();
    customers = customers.filter(c => c.email !== email);
    localStorage.setItem('sz_customers', JSON.stringify(customers));
    this.renderCustomers();
    DB.showToast('Success', 'Customer deleted successfully', 'success');
  },

  // Update order status
  updateOrderStatus(orderId, status) {
    let orders = DB.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      DB.setOrders(orders);
      DB.showToast('Order Updated', `${orderId} status changed to ${status}`, 'success');
    }
  },

  // View order detail
  viewOrderDetail(orderId) {
    const orders = DB.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const products = DB.getProducts();
    const itemsDetail = order.items.map(i => {
      const p = products.find(x => x.id === i.productId);
      return `${p ? p.name : 'Unknown'} x${i.qty} = ${DB.formatLKR(i.price * i.qty)}`;
    }).join('\n');
    
    const trackingInfo = order.trackingNumber ? 
      `\n\nTracking:\nCarrier: ${order.carrier}\nTracking #: ${order.trackingNumber}\nEst. Delivery: ${order.estimatedDelivery || 'N/A'}` : '';
    
    alert(`Order: ${order.id}\nCustomer: ${order.customer}\nPhone: ${order.phone}\nEmail: ${order.email}\nAddress: ${order.address}\nDistrict: ${order.district}, ${order.city}\nPayment: ${order.payment.toUpperCase()}\nStatus: ${order.status}\n\nItems:\n${itemsDetail}\n\nTotal: ${DB.formatLKR(order.total)}${trackingInfo}`);
  },

  // Manage tracking details
  manageTracking(orderId) {
    const orders = DB.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const trackingModal = this.createTrackingModal(order);
    document.body.appendChild(trackingModal);
    trackingModal.classList.add('active');
  },

  // Create tracking modal
  createTrackingModal(order) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'trackingModal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3><i class="fas fa-truck"></i> Manage Tracking - Order ${order.id}</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <form id="trackingForm">
            <div class="form-group">
              <label for="trackingCarrier">Carrier</label>
              <select id="trackingCarrier" class="form-control">
                <option value="">Select Carrier</option>
                <option value="Sri Lanka Post" ${order.carrier === 'Sri Lanka Post' ? 'selected' : ''}>Sri Lanka Post</option>
                <option value="DHL Express" ${order.carrier === 'DHL Express' ? 'selected' : ''}>DHL Express</option>
                <option value="FedEx" ${order.carrier === 'FedEx' ? 'selected' : ''}>FedEx</option>
                <option value="UPS" ${order.carrier === 'UPS' ? 'selected' : ''}>UPS</option>
                <option value="Aramex" ${order.carrier === 'Aramex' ? 'selected' : ''}>Aramex</option>
                <option value="Other" ${order.carrier === 'Other' ? 'selected' : ''}>Other</option>
              </select>
            </div>
            <div class="form-group">
              <label for="trackingNumber">Tracking Number</label>
              <input type="text" id="trackingNumber" class="form-control" value="${order.trackingNumber || ''}" placeholder="Enter tracking number">
            </div>
            <div class="form-group">
              <label for="trackingUrl">Tracking URL (optional)</label>
              <input type="url" id="trackingUrl" class="form-control" value="${order.trackingUrl || ''}" placeholder="https://...">
            </div>
            <div class="form-group">
              <label for="estimatedDelivery">Estimated Delivery</label>
              <input type="date" id="estimatedDelivery" class="form-control" value="${order.estimatedDelivery || ''}">
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">Cancel</button>
          <button type="button" class="btn btn-primary" onclick="Admin.saveTracking('${order.id}')">Save Tracking</button>
        </div>
      </div>
    `;
    return modal;
  },

  // Save tracking details
  saveTracking(orderId) {
    const carrier = document.getElementById('trackingCarrier').value;
    const trackingNumber = document.getElementById('trackingNumber').value.trim();
    const trackingUrl = document.getElementById('trackingUrl').value.trim();
    const estimatedDelivery = document.getElementById('estimatedDelivery').value;
    
    if (!carrier || !trackingNumber) {
      DB.showToast('Error', 'Carrier and tracking number are required', 'error');
      return;
    }
    
    let orders = DB.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.carrier = carrier;
      order.trackingNumber = trackingNumber;
      order.trackingUrl = trackingUrl;
      order.estimatedDelivery = estimatedDelivery;
      
      // Auto-update status to shipped if not already shipped/delivered
      if (order.status === 'confirmed' || order.status === 'processing') {
        order.status = 'shipped';
      }
      
      DB.setOrders(orders);
      document.getElementById('trackingModal').remove();
      this.renderOrders();
      DB.showToast('Tracking Updated', `Tracking details saved for ${orderId}`, 'success');
    }
  },

  // Edit product
  editProduct(id) {
    const products = DB.getProducts();
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    document.getElementById('prodName').value = product.name;
    const imgEl = document.getElementById('prodImageUrl');
    if (imgEl) imgEl.value = product.imgUrl || '';
    document.getElementById('prodBrand').value = product.brand;
    document.getElementById('prodCategory').value = product.category;
    document.getElementById('prodWifi').value = product.wifi || '';
    document.getElementById('prodPrice').value = product.price;
    document.getElementById('prodSalePrice').value = product.salePrice || '';
    document.getElementById('prodStock').value = product.stock;
    document.getElementById('prodSpeed').value = product.speed || '';
    document.getElementById('prodCoverage').value = product.coverage || '';
    document.getElementById('prodDesc').value = product.description || '';
    
    let specsText = '';
    if (product.specs) {
      specsText = Object.entries(product.specs).map(([k,v]) => `${k}: ${v}`).join('\n');
    }
    document.getElementById('prodSpecs').value = specsText;
    
    document.getElementById('productFormTitle').textContent = 'Edit Product';
    this.editingProductId = id;
    this.showSection('add-product');
  },

  // Delete product
  deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    let products = DB.getProducts().filter(p => p.id !== id);
    DB.setProducts(products);
    this.renderProducts();
    DB.showToast('Product Deleted', 'The product has been removed.', 'success');
  },

  // Save product (add or edit)
  setupSaveProduct() {
    const btn = document.getElementById('saveProductBtn');
    if (btn) {
      btn.addEventListener('click', () => this.saveProduct());
    }
  },

  saveProduct() {
    const imgEl = document.getElementById('prodImageUrl');
    const imgUrl = imgEl ? imgEl.value.trim() : '';
    const name = document.getElementById('prodName').value.trim();
    const brand = document.getElementById('prodBrand').value;
    const category = document.getElementById('prodCategory').value;
    const wifi = document.getElementById('prodWifi').value;
    const price = parseInt(document.getElementById('prodPrice').value);
    const salePrice = parseInt(document.getElementById('prodSalePrice').value) || null;
    const stock = parseInt(document.getElementById('prodStock').value);
    const speed = document.getElementById('prodSpeed').value.trim();
    const coverage = document.getElementById('prodCoverage').value.trim();
    const desc = document.getElementById('prodDesc').value.trim();
    const specsText = document.getElementById('prodSpecs').value.trim();
    
    if (!name || !brand || !category || !price || isNaN(stock)) {
      DB.showToast('Error', 'Please fill in all required fields.', 'error');
      return;
    }
    
    // Parse specs
    const specs = {};
    if (specsText) {
      specsText.split('\n').forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) specs[parts[0].trim()] = parts.slice(1).join(':').trim();
      });
    }
    
    const products = DB.getProducts();
    
    if (this.editingProductId) {
      // Edit existing
      const idx = products.findIndex(p => p.id === this.editingProductId);
      if (idx >= 0) {
        products[idx] = { ...products[idx], imgUrl, name, brand, category, wifi, price, salePrice, stock, speed, coverage, description: desc, specs };
      }
      DB.showToast('Product Updated', `${name} has been updated.`, 'success');
    } else {
      // Add new
      const newProduct = {
        id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
        imgUrl, name, brand, category, wifi, speed, coverage, price, salePrice, stock,
        rating: 4.5, reviews: 0,
        badge: salePrice ? 'sale' : '', isNew: !salePrice, isHot: false,
        description: desc, specs
      };
      products.push(newProduct);
      DB.showToast('Product Added', `${name} has been added to the store.`, 'success');
    }
    
    DB.setProducts(products);
    this.clearProductForm();
    this.showSection('products');
  },

  // Clear product form
  setupClearForm() {
    const btn = document.getElementById('clearFormBtn');
    if (btn) {
      btn.addEventListener('click', () => this.clearProductForm());
    }
  },

  clearProductForm() {
    ['prodImageUrl','prodName','prodBrand','prodCategory','prodWifi','prodPrice','prodSalePrice','prodStock','prodSpeed','prodCoverage','prodDesc','prodSpecs'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('productFormTitle').textContent = 'Add New Product';
    this.editingProductId = null;
  },

  // Setup order confirm modal close
  setupOrderConfirmModal() {
    const overlay = document.getElementById('orderConfirmModal');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
      });
    }
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => Admin.init());