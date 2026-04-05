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
    this.setupImageUpload();
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
              <option value="arrived" ${o.status==='arrived'?'selected':''}>Arrived</option>
              <option value="delivered" ${o.status==='delivered'?'selected':''}>Delivered</option>
              <option value="cancelled" ${o.status==='cancelled'?'selected':''}>Cancelled</option>
            </select>
          </td>
          <td>${o.date}</td>
          <td>
            <div class="action-btns">
              <button class="action-btn" onclick="Admin.viewOrderDetail('${o.id}')" title="View"><i class="fas fa-eye"></i></button>
              <button class="action-btn" onclick="Admin.printShippingLabel('${o.id}')" title="Print Shipping Label"><i class="fas fa-print"></i></button>
              <button class="action-btn delete" onclick="Admin.deleteOrder('${o.id}')" title="Delete"><i class="fas fa-trash"></i></button>
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
      
      // Send email notification when order arrives
      if (status === 'arrived') {
        this.sendArrivalEmail(order);
      }
    }
  },

  // Send arrival email notification
  sendArrivalEmail(order) {
    // Create email content
    const emailSubject = `Your Order ${order.id} Has Arrived! - Smart Zone LK`;
    const emailBody = `
Dear ${order.customer},

Great news! Your order has arrived and is ready for delivery.

Order Details:
- Order ID: ${order.id}
- Total Amount: ${DB.formatLKR(order.total)}
- Delivery Address: ${order.address}, ${order.city}, ${order.district}
- Contact: ${order.phone}

Items Ordered:
${order.items.map(item => `- ${item.name} x${item.qty} = ${DB.formatLKR(item.price * item.qty)}`).join('\n')}

Delivery Information:
- Delivery will be made within 1-2 business days
- Our delivery team will contact you before arrival
- Please have the payment ready if you selected Cash on Delivery

Thank you for shopping with Smart Zone LK!

Best regards,
Smart Zone LK Team
📞 +94 78 68000 86
📧 smartzonelk101@gmail.com
🌐 www.smartzonelk.com
    `;

    // Create mailto link
    const mailtoLink = `mailto:${order.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    
    // Open email client
    window.open(mailtoLink);
    
    DB.showToast('Email Sent', `Arrival notification email opened for ${order.customer}`, 'success');
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
    
    alert(`Order: ${order.id}\nCustomer: ${order.customer}\nPhone: ${order.phone}\nEmail: ${order.email}\nAddress: ${order.address}\nDistrict: ${order.district}, ${order.city}\nPayment: ${order.payment.toUpperCase()}\nStatus: ${order.status}\n\nItems:\n${itemsDetail}\n\nTotal: ${DB.formatLKR(order.total)}`);
  },

  // Delete order
  deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;
    
    let orders = DB.getOrders();
    orders = orders.filter(o => o.id !== orderId);
    DB.setOrders(orders);
    this.renderOrders();
    this.renderDashboard(); // Update dashboard stats
    DB.showToast('Order Deleted', `Order ${orderId} has been removed.`, 'success');
  },

  // Print shipping label
  printShippingLabel(orderId) {
    const orders = DB.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      DB.showToast('Error', 'Order not found.', 'error');
      return;
    }

    // Create shipping label HTML
    const shippingLabel = this.generateShippingLabel(order);
    
    // Open new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(shippingLabel);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
    }, 500);
    
    DB.showToast('Shipping Label', `Shipping label for ${orderId} ready for printing.`, 'success');
  },

  // Generate shipping label HTML
  generateShippingLabel(order) {
    const products = DB.getProducts();
    const itemsHtml = order.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px;">${product ? product.name : 'Unknown Product'}</td>
          <td style="padding: 8px; text-align: center;">${item.qty}</td>
          <td style="padding: 8px; text-align: right;">${DB.formatLKR(item.price)}</td>
          <td style="padding: 8px; text-align: right;">${DB.formatLKR(item.price * item.qty)}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Shipping Label - ${order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .label-container { 
            max-width: 800px; 
            margin: 0 auto; 
            border: 2px solid #333; 
            padding: 20px; 
            background: white;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #333; 
            padding-bottom: 15px; 
            margin-bottom: 20px; 
          }
          .header h1 { margin: 0; font-size: 24px; color: #333; }
          .header .order-id { font-size: 18px; font-weight: bold; color: #007bff; }
          .address-section { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 20px; 
            border: 1px solid #ddd; 
            padding: 15px; 
            background: #f9f9f9;
          }
          .from-address, .to-address { flex: 1; }
          .from-address { margin-right: 20px; }
          .section-title { font-weight: bold; margin-bottom: 10px; color: #333; }
          .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
          }
          .items-table th { 
            background: #333; 
            color: white; 
            padding: 10px; 
            text-align: left; 
          }
          .total-section { 
            text-align: right; 
            font-size: 18px; 
            font-weight: bold; 
            border-top: 2px solid #333; 
            padding-top: 15px; 
          }
          .barcode { 
            text-align: center; 
            margin-top: 20px; 
            padding: 10px; 
            border: 1px dashed #ccc; 
            background: #f0f0f0;
          }
          .footer { 
            text-align: center; 
            margin-top: 20px; 
            font-size: 12px; 
            color: #666; 
          }
          @media print {
            body { padding: 10px; }
            .label-container { border: 1px solid #333; }
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <div class="header">
            <h1>Smart Zone LK</h1>
            <div class="order-id">Order ID: ${order.id}</div>
          </div>
          
          <div class="address-section">
            <div class="from-address">
              <div class="section-title">FROM:</div>
              <div><strong>Smart Zone LK</strong></div>
              <div>No. 45, Galle Road</div>
              <div>Colombo 03, Sri Lanka</div>
              <div>+94 78 68000 86</div>
              <div>info@smartzonelk.com</div>
            </div>
            
            <div class="to-address">
              <div class="section-title">TO:</div>
              <div><strong>${order.customer}</strong></div>
              <div>${order.address}</div>
              <div>${order.city}, ${order.district}</div>
              <div>Sri Lanka</div>
              <div>${order.phone}</div>
              <div>${order.email}</div>
            </div>
          </div>
          
          <div class="section-title">ORDER ITEMS:</div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div class="total-section">
            Total Amount: ${DB.formatLKR(order.total)}
          </div>
          
          <div class="barcode">
            <div>${order.id}</div>
            <small>Scan for order tracking</small>
          </div>
          
          <div class="footer">
            <div>Payment Method: ${order.payment.toUpperCase()}</div>
            <div>Order Date: ${order.date}</div>
            <div>Order Status: ${order.status.toUpperCase()}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  // Edit product
  editProduct(id) {
    const products = DB.getProducts();
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    // Load product data into form
    document.getElementById('prodName').value = product.name;
    const imgEl = document.getElementById('prodImageUrl');
    if (imgEl) {
      imgEl.value = product.imgUrl || '';
      // Show image preview if there's an image
      if (product.imgUrl) {
        this.showImagePreview(product.imgUrl);
      } else {
        this.hideImagePreview();
      }
    }
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
    
    // Update UI for edit mode
    document.getElementById('productFormTitle').textContent = 'Edit Product';
    const saveBtn = document.getElementById('saveProductBtn');
    if (saveBtn) {
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Update Product';
      saveBtn.style.background = 'var(--warning)';
    }
    
    // Set editing mode flag
    this.editingProductId = id;
    
    // Show add-product section with edit data
    this.showSection('add-product');
    
    // Show edit notification
    DB.showToast('Edit Mode', `Now editing: ${product.name}`, 'info');
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
    this.hideImagePreview();
    
    // Reset button to add mode
    const saveBtn = document.getElementById('saveProductBtn');
    if (saveBtn) {
      saveBtn.innerHTML = '<i class="fas fa-plus"></i> Add Product';
      saveBtn.style.background = '';
    }
    
    // Clear file input
    const fileInput = document.getElementById('prodImageFile');
    if (fileInput) {
      fileInput.value = '';
    }
  },

  // Setup order confirm modal close
  setupOrderConfirmModal() {
    const overlay = document.getElementById('orderConfirmModal');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
      });
    }
  },

  // Setup image upload functionality
  setupImageUpload() {
    const fileInput = document.getElementById('prodImageFile');
    const urlInput = document.getElementById('prodImageUrl');
    
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleImageSelect(e));
    }
    
    if (urlInput) {
      urlInput.addEventListener('input', (e) => this.handleUrlInput(e));
    }
  },

  // Select image from file input
  selectImage() {
    const fileInput = document.getElementById('prodImageFile');
    if (fileInput) {
      fileInput.click();
    }
  },

  // Handle image file selection
  handleImageSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.showImagePreview(e.target.result);
        // Update URL input with base64 data
        const urlInput = document.getElementById('prodImageUrl');
        if (urlInput) {
          urlInput.value = e.target.result;
        }
      };
      reader.readAsDataURL(file);
    } else {
      DB.showToast('Error', 'Please select a valid image file.', 'error');
    }
  },

  // Handle URL input
  handleUrlInput(e) {
    const url = e.target.value.trim();
    if (url && (url.startsWith('http') || url.startsWith('data:image'))) {
      this.showImagePreview(url);
    } else {
      this.hideImagePreview();
    }
  },

  // Show image preview
  showImagePreview(imageSrc) {
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewImg = document.getElementById('imagePreview');
    
    if (previewContainer && previewImg) {
      previewImg.src = imageSrc;
      previewContainer.style.display = 'block';
    }
  },

  // Hide image preview
  hideImagePreview() {
    const previewContainer = document.getElementById('imagePreviewContainer');
    if (previewContainer) {
      previewContainer.style.display = 'none';
    }
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => Admin.init());
