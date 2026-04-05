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
    this.setupAdminNavigation();
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

  // Render products table with enhanced editing
  renderProducts() {
    const products = DB.getProducts();
    
    // Debug: Log the products being loaded for display
    console.log('Products loaded for display:', products);
    console.log('Products count:', products.length);
    
    const body = document.getElementById('adminProductsBody');
    const headerRow = document.querySelector('#admin-products table thead tr');
    
    // Add bulk edit controls to header if not already present
    if (headerRow && !headerRow.querySelector('.bulk-header')) {
      headerRow.innerHTML = `
        <th class="bulk-header"><input type="checkbox" id="selectAllProducts" onchange="Admin.toggleSelectAll()"></th>
        <th>Product</th><th>Brand</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th>
      `;
    }
    
    if (body) {
      body.innerHTML = products.map(p => `
        <tr id="product-row-${p.id}" data-product-id="${p.id}">
          <td><input type="checkbox" class="bulk-checkbox product-checkbox" value="${p.id}" onchange="Admin.updateBulkSelection()"></td>
          <td><strong>${p.name}</strong></td>
          <td>${p.brand}</td>
          <td>${p.category}</td>
          <td class="editable-price" data-product-id="${p.id}">
            <div class="price-display">
              ${p.salePrice ? `<span style="text-decoration:line-through;color:var(--gray-400);">${DB.formatLKR(p.price)}</span> ${DB.formatLKR(p.salePrice)}` : DB.formatLKR(p.price)}
              <button class="quick-edit-btn" onclick="Admin.quickEditPrice(${p.id})" title="Quick Edit Price"><i class="fas fa-pen"></i></button>
            </div>
            <div class="price-edit" style="display:none;">
              <input type="number" class="price-input" value="${p.price}" placeholder="Regular" data-type="price" data-product-id="${p.id}">
              <input type="number" class="price-input" value="${p.salePrice || ''}" placeholder="Sale" data-type="salePrice" data-product-id="${p.id}">
              <button class="save-btn" onclick="Admin.savePriceEdit(${p.id})"><i class="fas fa-check"></i></button>
              <button class="cancel-btn" onclick="Admin.cancelPriceEdit(${p.id})"><i class="fas fa-times"></i></button>
            </div>
          </td>
          <td class="editable-stock" data-product-id="${p.id}">
            <div class="stock-display">
              <strong style="color:${p.stock <= 10 ? 'var(--danger)' : 'var(--success)'};">${p.stock}</strong>
              <button class="quick-edit-btn" onclick="Admin.quickEditStock(${p.id})" title="Quick Edit Stock"><i class="fas fa-pen"></i></button>
            </div>
            <div class="stock-edit" style="display:none;">
              <input type="number" class="stock-input" value="${p.stock}" min="0" data-product-id="${p.id}">
              <button class="save-btn" onclick="Admin.saveStockEdit(${p.id})"><i class="fas fa-check"></i></button>
              <button class="cancel-btn" onclick="Admin.cancelStockEdit(${p.id})"><i class="fas fa-times"></i></button>
            </div>
          </td>
          <td><span class="status-badge ${p.stock > 0 ? 'status-delivered' : 'status-cancelled'}">${p.stock > 0 ? 'Active' : 'Out of Stock'}</span></td>
          <td>
            <div class="action-btns">
              <button class="action-btn" onclick="Admin.editProduct(${p.id})" title="Full Edit"><i class="fas fa-edit"></i></button>
              <button class="action-btn" onclick="Admin.duplicateProduct(${p.id})" title="Duplicate"><i class="fas fa-copy"></i></button>
              <button class="action-btn delete" onclick="Admin.deleteProduct(${p.id})" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `).join('');
    }
    
    // Add bulk edit controls panel if not exists
    this.addBulkEditControls();
  },

  // Add bulk edit controls
  addBulkEditControls() {
    const productsSection = document.getElementById('admin-products');
    if (!productsSection || document.getElementById('bulkEditControls')) return;
    
    const bulkControls = document.createElement('div');
    bulkControls.id = 'bulkEditControls';
    bulkControls.className = 'bulk-edit-controls';
    bulkControls.innerHTML = `
      <h4><i class="fas fa-edit"></i> Bulk Operations</h4>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
        <span id="selectedCount">0 products selected</span>
        <button class="btn btn-sm btn-primary" onclick="Admin.bulkUpdatePrices()">
          <i class="fas fa-tag"></i> Update Prices
        </button>
        <button class="btn btn-sm btn-primary" onclick="Admin.bulkUpdateStock()">
          <i class="fas fa-boxes"></i> Update Stock
        </button>
        <button class="btn btn-sm btn-danger" onclick="Admin.bulkDelete()">
          <i class="fas fa-trash"></i> Delete Selected
        </button>
        <button class="btn btn-sm btn-outline" onclick="Admin.clearSelection()">
          <i class="fas fa-times"></i> Clear Selection
        </button>
      </div>
    `;
    
    // Insert after the header
    const header = productsSection.querySelector('.admin-header');
    if (header) {
      header.parentNode.insertBefore(bulkControls, header.nextSibling);
    }
  },

  // Quick edit price
  quickEditPrice(productId) {
    const priceCell = document.querySelector(`.editable-price[data-product-id="${productId}"]`);
    const displayDiv = priceCell.querySelector('.price-display');
    const editDiv = priceCell.querySelector('.price-edit');
    
    displayDiv.style.display = 'none';
    editDiv.style.display = 'flex';
    
    // Focus on first input
    editDiv.querySelector('.price-input').focus();
  },

  // Quick edit stock
  quickEditStock(productId) {
    const stockCell = document.querySelector(`.editable-stock[data-product-id="${productId}"]`);
    const displayDiv = stockCell.querySelector('.stock-display');
    const editDiv = stockCell.querySelector('.stock-edit');
    
    displayDiv.style.display = 'none';
    editDiv.style.display = 'flex';
    
    // Focus on stock input
    editDiv.querySelector('.stock-input').focus();
    editDiv.querySelector('.stock-input').select();
  },

  // Save price edit
  savePriceEdit(productId) {
    const priceInputs = document.querySelectorAll(`.price-input[data-product-id="${productId}"]`);
    const regularPrice = parseInt(priceInputs[0].value) || 0;
    const salePrice = parseInt(priceInputs[1].value) || 0;
    
    if (regularPrice <= 0) {
      DB.showToast('Error', 'Regular price must be greater than 0', 'error');
      return;
    }
    
    let products = DB.getProducts();
    const product = products.find(p => p.id === productId);
    if (product) {
      product.price = regularPrice;
      product.salePrice = salePrice > 0 ? salePrice : null;
      DB.setProducts(products);
      this.renderProducts();
      DB.showToast('Price Updated', `Prices updated for ${product.name}`, 'success');
    }
  },

  // Save stock edit
  saveStockEdit(productId) {
    const stockInput = document.querySelector(`.stock-input[data-product-id="${productId}"]`);
    const newStock = parseInt(stockInput.value) || 0;
    
    if (newStock < 0) {
      DB.showToast('Error', 'Stock cannot be negative', 'error');
      return;
    }
    
    let products = DB.getProducts();
    const product = products.find(p => p.id === productId);
    if (product) {
      product.stock = newStock;
      DB.setProducts(products);
      this.renderProducts();
      DB.showToast('Stock Updated', `Stock updated to ${newStock} for ${product.name}`, 'success');
    }
  },

  // Cancel price edit
  cancelPriceEdit(productId) {
    const priceCell = document.querySelector(`.editable-price[data-product-id="${productId}"]`);
    const displayDiv = priceCell.querySelector('.price-display');
    const editDiv = priceCell.querySelector('.price-edit');
    
    displayDiv.style.display = 'block';
    editDiv.style.display = 'none';
  },

  // Cancel stock edit
  cancelStockEdit(productId) {
    const stockCell = document.querySelector(`.editable-stock[data-product-id="${productId}"]`);
    const displayDiv = stockCell.querySelector('.stock-display');
    const editDiv = stockCell.querySelector('.stock-edit');
    
    displayDiv.style.display = 'block';
    editDiv.style.display = 'none';
  },

  // Toggle select all products
  toggleSelectAll() {
    const selectAll = document.getElementById('selectAllProducts');
    const checkboxes = document.querySelectorAll('.product-checkbox');
    
    checkboxes.forEach(checkbox => {
      checkbox.checked = selectAll.checked;
      const row = checkbox.closest('tr');
      if (selectAll.checked) {
        row.classList.add('product-row-selected');
      } else {
        row.classList.remove('product-row-selected');
      }
    });
    
    this.updateBulkSelection();
  },

  // Update bulk selection
  updateBulkSelection() {
    const checkboxes = document.querySelectorAll('.product-checkbox:checked');
    const selectedCount = checkboxes.length;
    const bulkControls = document.getElementById('bulkEditControls');
    const selectedCountEl = document.getElementById('selectedCount');
    
    if (selectedCountEl) {
      selectedCountEl.textContent = `${selectedCount} product${selectedCount !== 1 ? 's' : ''} selected`;
    }
    
    // Show/hide bulk controls
    if (bulkControls) {
      if (selectedCount > 0) {
        bulkControls.classList.add('active');
      } else {
        bulkControls.classList.remove('active');
      }
    }
    
    // Update row styling
    document.querySelectorAll('.product-checkbox').forEach(checkbox => {
      const row = checkbox.closest('tr');
      if (checkbox.checked) {
        row.classList.add('product-row-selected');
      } else {
        row.classList.remove('product-row-selected');
      }
    });
  },

  // Clear selection
  clearSelection() {
    document.getElementById('selectAllProducts').checked = false;
    document.querySelectorAll('.product-checkbox').forEach(checkbox => {
      checkbox.checked = false;
      const row = checkbox.closest('tr');
      row.classList.remove('product-row-selected');
    });
    this.updateBulkSelection();
  },

  // Get selected product IDs
  getSelectedProductIds() {
    const checkboxes = document.querySelectorAll('.product-checkbox:checked');
    return Array.from(checkboxes).map(cb => parseInt(cb.value));
  },

  // Bulk update prices
  bulkUpdatePrices() {
    const selectedIds = this.getSelectedProductIds();
    if (selectedIds.length === 0) return;
    
    const modal = this.createBulkPriceModal(selectedIds);
    document.body.appendChild(modal);
    modal.classList.add('active');
  },

  // Create bulk price update modal
  createBulkPriceModal(productIds) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'bulkPriceModal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3><i class="fas fa-tag"></i> Bulk Price Update (${productIds.length} products)</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Price Update Type</label>
            <select id="bulkPriceType" class="form-control" onchange="Admin.toggleBulkPriceFields()">
              <option value="set">Set Specific Price</option>
              <option value="increase">Increase by Amount/Percentage</option>
              <option value="decrease">Decrease by Amount/Percentage</option>
            </select>
          </div>
          <div id="setPriceFields">
            <div class="form-group">
              <label>Regular Price (LKR)</label>
              <input type="number" id="bulkRegularPrice" class="form-control" placeholder="e.g. 24990">
            </div>
            <div class="form-group">
              <label>Sale Price (LKR, optional)</label>
              <input type="number" id="bulkSalePrice" class="form-control" placeholder="e.g. 19990">
            </div>
          </div>
          <div id="adjustPriceFields" style="display:none;">
            <div class="form-group">
              <label>Adjustment Type</label>
              <select id="bulkAdjustmentType" class="form-control">
                <option value="amount">Fixed Amount</option>
                <option value="percentage">Percentage</option>
              </select>
            </div>
            <div class="form-group">
              <label>Adjustment Value</label>
              <input type="number" id="bulkAdjustmentValue" class="form-control" placeholder="e.g. 1000 or 10">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">Cancel</button>
          <button type="button" class="btn btn-primary" onclick="Admin.saveBulkPriceUpdate([${productIds}])">Update Prices</button>
        </div>
      </div>
    `;
    return modal;
  },

  // Toggle bulk price fields
  toggleBulkPriceFields() {
    const type = document.getElementById('bulkPriceType').value;
    const setFields = document.getElementById('setPriceFields');
    const adjustFields = document.getElementById('adjustPriceFields');
    
    if (type === 'set') {
      setFields.style.display = 'block';
      adjustFields.style.display = 'none';
    } else {
      setFields.style.display = 'none';
      adjustFields.style.display = 'block';
    }
  },

  // Save bulk price update
  saveBulkPriceUpdate(productIds) {
    const type = document.getElementById('bulkPriceType').value;
    let products = DB.getProducts();
    
    productIds.forEach(id => {
      const product = products.find(p => p.id === id);
      if (!product) return;
      
      if (type === 'set') {
        const regularPrice = parseInt(document.getElementById('bulkRegularPrice').value) || 0;
        const salePrice = parseInt(document.getElementById('bulkSalePrice').value) || 0;
        
        if (regularPrice > 0) {
          product.price = regularPrice;
          product.salePrice = salePrice > 0 ? salePrice : null;
        }
      } else {
        const adjustmentType = document.getElementById('bulkAdjustmentType').value;
        const adjustmentValue = parseFloat(document.getElementById('bulkAdjustmentValue').value) || 0;
        
        if (adjustmentValue > 0) {
          if (adjustmentType === 'amount') {
            product.price += (type === 'increase' ? adjustmentValue : -adjustmentValue);
          } else {
            product.price *= (type === 'increase' ? (1 + adjustmentValue/100) : (1 - adjustmentValue/100));
          }
          product.price = Math.round(product.price);
        }
      }
    });
    
    DB.setProducts(products);
    document.getElementById('bulkPriceModal').remove();
    this.renderProducts();
    this.clearSelection();
    DB.showToast('Bulk Update', `Prices updated for ${productIds.length} products`, 'success');
  },

  // Bulk update stock
  bulkUpdateStock() {
    const selectedIds = this.getSelectedProductIds();
    if (selectedIds.length === 0) return;
    
    const modal = this.createBulkStockModal(selectedIds);
    document.body.appendChild(modal);
    modal.classList.add('active');
  },

  // Create bulk stock update modal
  createBulkStockModal(productIds) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'bulkStockModal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <h3><i class="fas fa-boxes"></i> Bulk Stock Update (${productIds.length} products)</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Stock Update Type</label>
            <select id="bulkStockType" class="form-control">
              <option value="set">Set Specific Stock</option>
              <option value="add">Add Stock</option>
              <option value="subtract">Subtract Stock</option>
            </select>
          </div>
          <div class="form-group">
            <label>Stock Quantity</label>
            <input type="number" id="bulkStockValue" class="form-control" min="0" placeholder="e.g. 50">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">Cancel</button>
          <button type="button" class="btn btn-primary" onclick="Admin.saveBulkStockUpdate([${productIds}])">Update Stock</button>
        </div>
      </div>
    `;
    return modal;
  },

  // Save bulk stock update
  saveBulkStockUpdate(productIds) {
    const type = document.getElementById('bulkStockType').value;
    const stockValue = parseInt(document.getElementById('bulkStockValue').value) || 0;
    
    if (stockValue < 0) {
      DB.showToast('Error', 'Stock value cannot be negative', 'error');
      return;
    }
    
    let products = DB.getProducts();
    
    productIds.forEach(id => {
      const product = products.find(p => p.id === id);
      if (!product) return;
      
      if (type === 'set') {
        product.stock = stockValue;
      } else if (type === 'add') {
        product.stock += stockValue;
      } else if (type === 'subtract') {
        product.stock = Math.max(0, product.stock - stockValue);
      }
    });
    
    DB.setProducts(products);
    document.getElementById('bulkStockModal').remove();
    this.renderProducts();
    this.clearSelection();
    DB.showToast('Bulk Update', `Stock updated for ${productIds.length} products`, 'success');
  },

  // Bulk delete
  bulkDelete() {
    const selectedIds = this.getSelectedProductIds();
    if (selectedIds.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected products? This action cannot be undone.`)) return;
    
    let products = DB.getProducts();
    products = products.filter(p => !selectedIds.includes(p.id));
    DB.setProducts(products);
    this.renderProducts();
    this.clearSelection();
    DB.showToast('Bulk Delete', `${selectedIds.length} products deleted`, 'success');
  },

  // Duplicate product
  duplicateProduct(id) {
    const products = DB.getProducts();
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    if (!confirm(`Create a duplicate of "${product.name}"?`)) return;
    
    const newProduct = {
      ...product,
      id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
      name: product.name + ' (Copy)',
      stock: 0 // Reset stock for duplicate
    };
    
    products.push(newProduct);
    DB.setProducts(products);
    this.renderProducts();
    DB.showToast('Product Duplicated', `Duplicate created: ${newProduct.name}`, 'success');
  },

  // Preview product image
  previewProductImage() {
    const imageUrl = document.getElementById('prodImageUrl').value.trim();
    const previewContainer = document.getElementById('imagePreviewContainer');
    
    if (imageUrl) {
      previewContainer.innerHTML = `<img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" onerror="this.onerror=null;this.parentElement.innerHTML='<i class=\\'fas fa-exclamation-triangle\\' style=\\'font-size:2rem;color:var(--warning);\\'></i>';">`;
    } else {
      previewContainer.innerHTML = '<i class="fas fa-image" style="font-size:2rem;color:var(--gray-400);"></i>';
    }
  },

  // Edit product (full edit)
  editProduct(id) {
    const products = DB.getProducts();
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    // Basic Information
    document.getElementById('prodName').value = product.name || '';
    document.getElementById('prodBrand').value = product.brand || '';
    document.getElementById('prodCategory').value = product.category || '';
    
    // Image
    const imgEl = document.getElementById('prodImageUrl');
    if (imgEl) imgEl.value = product.imgUrl || '';
    this.previewProductImage();
    
    // Technical Specifications
    document.getElementById('prodWifi').value = product.wifi || '';
    document.getElementById('prodSpeed').value = product.speed || '';
    document.getElementById('prodCoverage').value = product.coverage || '';
    document.getElementById('prodCapacity').value = product.capacity || '';
    document.getElementById('prodBands').value = product.bands || '';
    
    // Pricing and Inventory
    document.getElementById('prodPrice').value = product.price || '';
    document.getElementById('prodSalePrice').value = product.salePrice || '';
    document.getElementById('prodStock').value = product.stock || '';
    document.getElementById('prodSku').value = product.sku || '';
    document.getElementById('prodWarranty').value = product.warranty || '';
    
    // Product Details
    document.getElementById('prodDesc').value = product.description || '';
    document.getElementById('prodFullDesc').value = product.fullDescription || '';
    document.getElementById('prodFeatures').value = product.features ? product.features.join('\n') : '';
    
    // Advanced Specifications
    let specsText = '';
    if (product.specs) {
      specsText = Object.entries(product.specs).map(([k,v]) => `${k}: ${v}`).join('\n');
    }
    document.getElementById('prodSpecs').value = specsText;
    document.getElementById('prodPackage').value = product.packageContents || '';
    document.getElementById('prodDimensions').value = product.dimensions || '';
    document.getElementById('prodWeight').value = product.weight || '';
    
    // Product Status
    document.getElementById('prodStatus').value = product.status || 'active';
    
    // Badges
    document.getElementById('badgeNew').checked = product.isNew || false;
    document.getElementById('badgeSale').checked = product.badge === 'sale' || false;
    document.getElementById('badgeHot').checked = product.isHot || false;
    document.getElementById('badgeFeatured').checked = product.isFeatured || false;
    
    // Rating and Reviews
    document.getElementById('prodRating').value = product.rating || 4.5;
    document.getElementById('prodReviews').value = product.reviews || 0;
    
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
              ${o.trackingNumber ? `<button class="action-btn" onclick="Admin.addTrackingUpdate('${o.id}')" title="Add Update"><i class="fas fa-plus-circle"></i></button>` : ''}
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
      const isNewTracking = !order.trackingNumber;
      
      order.carrier = carrier;
      order.trackingNumber = trackingNumber;
      order.trackingUrl = trackingUrl;
      order.estimatedDelivery = estimatedDelivery;
      
      // Initialize tracking history if it doesn't exist
      if (!order.trackingHistory) {
        order.trackingHistory = [];
      }
      
      // Add initial tracking event if this is a new tracking number
      if (isNewTracking) {
        order.trackingHistory.push({
          timestamp: new Date().toISOString(),
          status: 'Tracking Information Added',
          location: 'Smart Zone System',
          description: `Tracking number ${trackingNumber} assigned via ${carrier}`
        });
      }
      
      // Auto-update status to shipped if not already shipped/delivered
      if (order.status === 'confirmed' || order.status === 'processing') {
        order.status = 'shipped';
        
        // Add shipped status to tracking history
        order.trackingHistory.push({
          timestamp: new Date().toISOString(),
          status: 'Order Shipped',
          location: carrier + ' Facility',
          description: 'Package has been shipped and is in transit'
        });
      }
      
      DB.setOrders(orders);
      document.getElementById('trackingModal').remove();
      this.renderOrders();
      DB.showToast('Tracking Updated', `Tracking details saved for ${orderId}`, 'success');
    }
  },

  // Add tracking update
  addTrackingUpdate(orderId) {
    const orders = DB.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.trackingNumber) {
      DB.showToast('Error', 'Please add tracking information first', 'error');
      return;
    }
    
    const modal = this.createTrackingUpdateModal(order);
    document.body.appendChild(modal);
    modal.classList.add('active');
  },

  // Create tracking update modal
  createTrackingUpdateModal(order) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'trackingUpdateModal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3><i class="fas fa-plus-circle"></i> Add Tracking Update - Order ${order.id}</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div style="background:var(--primary-light);padding:12px;border-radius:8px;margin-bottom:16px;">
            <div style="font-size:0.85rem;color:var(--gray-600);margin-bottom:4px;">Current Tracking</div>
            <div style="font-weight:600;color:var(--primary);">${order.carrier} - ${order.trackingNumber}</div>
          </div>
          
          <form id="trackingUpdateForm">
            <div class="form-group">
              <label for="updateStatus">Status *</label>
              <select id="updateStatus" class="form-control" required>
                <option value="">Select Status</option>
                <option value="Order Confirmed">Order Confirmed</option>
                <option value="Package Picked Up">Package Picked Up</option>
                <option value="In Transit">In Transit</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Delivery Attempted">Delivery Attempted</option>
                <option value="Custom Status">Custom Status</option>
              </select>
            </div>
            <div class="form-group" id="customStatusGroup" style="display:none;">
              <label for="customStatus">Custom Status</label>
              <input type="text" id="customStatus" class="form-control" placeholder="Enter custom status">
            </div>
            <div class="form-group">
              <label for="updateLocation">Location *</label>
              <input type="text" id="updateLocation" class="form-control" placeholder="e.g. Colombo Sorting Center" required>
            </div>
            <div class="form-group">
              <label for="updateDescription">Description *</label>
              <textarea id="updateDescription" class="form-control" rows="3" placeholder="Describe the current status or activity" required></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">Cancel</button>
          <button type="button" class="btn btn-primary" onclick="Admin.saveTrackingUpdate('${order.id}')">Add Update</button>
        </div>
      </div>
    `;
    
    // Add event listener for status change
    setTimeout(() => {
      const statusSelect = document.getElementById('updateStatus');
      const customGroup = document.getElementById('customStatusGroup');
      if (statusSelect && customGroup) {
        statusSelect.addEventListener('change', () => {
          customGroup.style.display = statusSelect.value === 'Custom Status' ? 'block' : 'none';
        });
      }
    }, 100);
    
    return modal;
  },

  // Save tracking update
  saveTrackingUpdate(orderId) {
    const statusSelect = document.getElementById('updateStatus');
    const customStatus = document.getElementById('customStatus').value.trim();
    const location = document.getElementById('updateLocation').value.trim();
    const description = document.getElementById('updateDescription').value.trim();
    
    const status = statusSelect.value === 'Custom Status' ? customStatus : statusSelect.value;
    
    if (!status || !location || !description) {
      DB.showToast('Error', 'All fields are required', 'error');
      return;
    }
    
    let orders = DB.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      // Initialize tracking history if it doesn't exist
      if (!order.trackingHistory) {
        order.trackingHistory = [];
      }
      
      // Add new tracking event
      order.trackingHistory.push({
        timestamp: new Date().toISOString(),
        status: status,
        location: location,
        description: description
      });
      
      // Update order status if delivered
      if (status.toLowerCase().includes('delivered')) {
        order.status = 'delivered';
      } else if (status.toLowerCase().includes('shipped') && order.status !== 'delivered') {
        order.status = 'shipped';
      }
      
      DB.setOrders(orders);
      document.getElementById('trackingUpdateModal').remove();
      this.renderOrders();
      DB.showToast('Update Added', `Tracking update added for ${orderId}`, 'success');
    }
  },

  // Save product (add or edit)
  setupSaveProduct() {
    const btn = document.getElementById('saveProductBtn');
    if (btn) {
      btn.addEventListener('click', () => this.saveProduct());
    }
  },

  saveProduct() {
    // Basic Information
    const imgEl = document.getElementById('prodImageUrl');
    const imgUrl = imgEl ? imgEl.value.trim() : '';
    const name = document.getElementById('prodName').value.trim();
    const brand = document.getElementById('prodBrand').value;
    const category = document.getElementById('prodCategory').value;
    
    // Technical Specifications
    const wifi = document.getElementById('prodWifi').value;
    const speed = document.getElementById('prodSpeed').value.trim();
    const coverage = document.getElementById('prodCoverage').value.trim();
    const capacity = document.getElementById('prodCapacity').value.trim();
    const bands = document.getElementById('prodBands').value.trim();
    
    // Pricing and Inventory
    const price = parseInt(document.getElementById('prodPrice').value);
    const salePrice = parseInt(document.getElementById('prodSalePrice').value) || null;
    const stock = parseInt(document.getElementById('prodStock').value);
    const sku = document.getElementById('prodSku').value.trim();
    const warranty = document.getElementById('prodWarranty').value.trim();
    
    // Product Details
    const desc = document.getElementById('prodDesc').value.trim();
    const fullDesc = document.getElementById('prodFullDesc').value.trim();
    const featuresText = document.getElementById('prodFeatures').value.trim();
    
    // Advanced Specifications
    const specsText = document.getElementById('prodSpecs').value.trim();
    const packageContents = document.getElementById('prodPackage').value.trim();
    const dimensions = document.getElementById('prodDimensions').value.trim();
    const weight = document.getElementById('prodWeight').value.trim();
    
    // Product Status
    const status = document.getElementById('prodStatus').value;
    
    // Badges
    const isNew = document.getElementById('badgeNew').checked;
    const isSale = document.getElementById('badgeSale').checked;
    const isHot = document.getElementById('badgeHot').checked;
    const isFeatured = document.getElementById('badgeFeatured').checked;
    
    // Rating and Reviews
    const rating = parseFloat(document.getElementById('prodRating').value) || 4.5;
    const reviews = parseInt(document.getElementById('prodReviews').value) || 0;
    
    // Validation
    if (!name || !brand || !category || !price || isNaN(stock) || stock < 0) {
      DB.showToast('Error', 'Please fill in all required fields with valid values.', 'error');
      return;
    }
    
    if (price <= 0) {
      DB.showToast('Error', 'Price must be greater than 0.', 'error');
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
    
    // Parse features
    const features = featuresText ? featuresText.split('\n').filter(f => f.trim()) : [];
    
    const products = DB.getProducts();
    
    if (this.editingProductId) {
      // Edit existing
      const idx = products.findIndex(p => p.id === this.editingProductId);
      if (idx >= 0) {
        products[idx] = {
          ...products[idx],
          imgUrl, name, brand, category,
          wifi, speed, coverage, capacity, bands,
          price, salePrice, stock, sku, warranty,
          description: desc, fullDescription: fullDesc, features,
          specs, packageContents, dimensions, weight,
          status, isNew, isHot, isFeatured,
          rating, reviews
        };
        
        // Update badge based on checkboxes
        if (isSale) {
          products[idx].badge = 'sale';
        } else if (isNew) {
          products[idx].badge = 'new';
        } else {
          products[idx].badge = '';
        }
      }
      DB.showToast('Product Updated', `${name} has been updated successfully.`, 'success');
    } else {
      // Add new
      const newProduct = {
        id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
        imgUrl, name, brand, category,
        wifi, speed, coverage, capacity, bands,
        price, salePrice, stock, sku, warranty,
        description: desc, fullDescription: fullDesc, features,
        specs, packageContents, dimensions, weight,
        status: status || 'active',
        isNew, isHot, isFeatured,
        rating, reviews,
        badge: isSale ? 'sale' : (isNew ? 'new' : '')
      };
      products.push(newProduct);
      DB.showToast('Product Added', `${name} has been added to the store.`, 'success');
    }
    
    DB.setProducts(products);
    
    // Debug: Log the products to verify they're being saved
    console.log('Products after save:', products);
    console.log('Total products count:', products.length);
    
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
    // Clear all form fields
    const fields = [
      'prodImageUrl','prodName','prodBrand','prodCategory','prodWifi','prodSpeed','prodCoverage','prodCapacity','prodBands',
      'prodPrice','prodSalePrice','prodStock','prodSku','prodWarranty','prodDesc','prodFullDesc','prodFeatures',
      'prodSpecs','prodPackage','prodDimensions','prodWeight','prodStatus','prodRating','prodReviews'
    ];
    
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    
    // Reset checkboxes
    ['badgeNew','badgeSale','badgeHot','badgeFeatured'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.checked = false;
    });
    
    // Reset image preview
    const previewContainer = document.getElementById('imagePreviewContainer');
    if (previewContainer) {
      previewContainer.innerHTML = '<i class="fas fa-image" style="font-size:2rem;color:var(--gray-400);"></i>';
    }
    
    // Reset form title and editing state
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
  },

  // Setup admin navigation
  setupAdminNavigation() {
    // Handle admin navigation clicks
    document.querySelectorAll('[data-admin]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.getAttribute('data-admin');
        this.showSection(section);
      });
    });
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => Admin.init());
