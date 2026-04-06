/**
 * Smart Zone LK - Products Module
 * Handles product rendering, filtering, and display
 */

const Products = {
  // Render featured products on homepage
  renderFeaturedProducts() {
    const products = DB.getProducts();
    const featured = products.filter(p => p.isHot || p.isNew || p.badge === 'sale').slice(0, 8);
    const container = document.getElementById('featuredProducts');
    if (container) container.innerHTML = featured.map(p => this.createProductCard(p)).join('');
    
    // Debug: Log featured products being displayed
    console.log('Featured products to display:', featured);
    console.log('Featured products count:', featured.length);
  },

  // Render products in shop page
  renderShopProducts(filteredProducts = null) {
    const products = filteredProducts || DB.getProducts();
    
    // Debug: Log products being displayed
    console.log('Shop products to display:', products);
    console.log('Shop products count:', products.length);
    
    const container = document.getElementById('shopProducts');
    
    if (container) {
      container.innerHTML = products.length 
        ? products.map(p => this.createProductCard(p)).join('')
        : '<div class="empty-state"><i class="fas fa-search"></i><h3>No products found</h3><p>Try adjusting your filters or search terms</p><button class="btn btn-primary" onclick="navigateTo(\'shop\')">View All Products</button></div>';
    }
    
    const countEl = document.getElementById('productCount');
    if (countEl) countEl.textContent = products.length;
  },

  // Create product card HTML
  createProductCard(product) {
    const discount = product.salePrice ? Math.round((1 - product.salePrice / product.price) * 100) : 0;
    const stars = '★'.repeat(Math.floor(product.rating)) + (product.rating % 1 >= 0.5 ? '½' : '');
    
    // Badges
    let badges = '';
    if (product.badge === 'sale') badges = '<span class="badge-sale">Sale</span>';
    else if (product.isNew) badges = '<span class="badge-new">New</span>';
    else if (product.isHot) badges = '<span class="badge-hot">Hot</span>';
    if (badges) badges = `<div class="badge-tag">${badges}</div>`;
    
    // Price display
    const priceDisplay = product.salePrice 
      ? `<span class="price-current">${DB.formatLKR(product.salePrice)}</span>
         <span class="price-old">${DB.formatLKR(product.price)}</span>
         <span class="price-discount">-${discount}%</span>`
      : `<span class="price-current">${DB.formatLKR(product.price)}</span>`;
    
    // Spec tags
    const specTags = [];
    if (product.wifi) specTags.push(`<span class="spec-tag">${product.wifi}</span>`);
    if (product.speed) specTags.push(`<span class="spec-tag">${product.speed}</span>`);
    
    return `
      <div class="product-card" data-id="${product.id}">
        <div class="product-image">
          ${badges}
          <button class="wishlist-btn" onclick="event.stopPropagation();DB.showToast('Wishlist','Added to wishlist!','success')"><i class="far fa-heart"></i></button>
          <i class="fas fa-wifi"></i>
        </div>
        <div class="product-info">
          <div class="brand">${product.brand}</div>
          <h3>${product.name}</h3>
          <div class="specs">${specTags.join('')}</div>
          <div class="rating">
            <span class="stars">${stars}</span>
            <span class="rating-count">(${product.reviews})</span>
          </div>
          <div class="product-price">${priceDisplay}</div>
          <div class="product-actions">
            <button class="add-cart-btn" onclick="event.stopPropagation();Cart.addToCart(${product.id})"><i class="fas fa-cart-plus"></i> Add to Cart</button>
            <button class="quick-view-btn" onclick="event.stopPropagation();Products.viewProduct(${product.id})"><i class="fas fa-eye"></i></button>
          </div>
        </div>
      </div>
    `;
  },

  // View product detail page
  viewProduct(id) {
    const products = DB.getProducts();
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    document.getElementById('productBreadcrumb').textContent = product.name;
    
    const discount = product.salePrice ? Math.round((1 - product.salePrice / product.price) * 100) : 0;
    const stars = '★'.repeat(Math.floor(product.rating)) + (product.rating % 1 >= 0.5 ? '½' : '');
    
    // Specs table
    let specsHTML = '';
    if (product.specs) {
      specsHTML = '<table class="specs-table">';
      for (const [key, value] of Object.entries(product.specs)) {
        specsHTML += `<tr><td>${key}</td><td>${value}</td></tr>`;
      }
      specsHTML += '</table>';
    }
    
    // Price display
    const priceDisplay = product.salePrice
      ? `<span class="current">${DB.formatLKR(product.salePrice)}</span>
         <span class="old">${DB.formatLKR(product.price)}</span>
         <div class="save">You save ${discount}% - ${DB.formatLKR(product.price - product.salePrice)}</div>`
      : `<span class="current">${DB.formatLKR(product.price)}</span>`;
    
    document.getElementById('productDetail').innerHTML = `
      <div class="product-gallery">
        <div class="main-image"><i class="fas fa-wifi"></i></div>
        <div class="thumb-images">
          <div class="thumb active"><i class="fas fa-wifi"></i></div>
          <div class="thumb"><i class="fas fa-box"></i></div>
          <div class="thumb"><i class="fas fa-cog"></i></div>
          <div class="thumb"><i class="fas fa-image"></i></div>
        </div>
      </div>
      <div class="product-meta">
        <div class="brand-name">${product.brand}</div>
        <h1>${product.name}</h1>
        <div class="rating-big">
          <span class="stars">${stars}</span>
          <span>${product.rating} (${product.reviews} reviews)</span>
        </div>
        <div class="price-section">${priceDisplay}</div>
        ${specsHTML}
        <div class="quantity-selector">
          <label>Quantity:</label>
          <div class="qty-controls">
            <button class="qty-btn" onclick="Products.changeQty(-1)">−</button>
            <input type="number" class="qty-input" id="detailQty" value="1" min="1" max="${product.stock}">
            <button class="qty-btn" onclick="Products.changeQty(1)">+</button>
          </div>
          <span style="font-size:0.85rem;color:var(--gray-500);">${product.stock > 0 ? product.stock + ' in stock' : 'Out of stock'}</span>
        </div>
        <div class="detail-actions">
          <button class="btn btn-primary btn-lg" onclick="Cart.addToCart(${product.id}, parseInt(document.getElementById('detailQty').value))" ${product.stock <= 0 ? 'disabled' : ''}>
            <i class="fas fa-cart-plus"></i> Add to Cart
          </button>
          <button class="btn btn-ghost btn-lg" onclick="DB.showToast('Wishlist','Added to wishlist!','success')">
            <i class="far fa-heart"></i>
          </button>
        </div>
        <div style="display:flex;gap:20px;margin-top:16px;flex-wrap:wrap;">
          <span style="font-size:0.85rem;color:var(--gray-500);"><i class="fas fa-truck" style="color:var(--primary);"></i> Free delivery over LKR 15,000</span>
          <span style="font-size:0.85rem;color:var(--gray-500);"><i class="fas fa-shield-halved" style="color:var(--success);"></i> Official Warranty</span>
          <span style="font-size:0.85rem;color:var(--gray-500);"><i class="fas fa-undo" style="color:var(--warning);"></i> 7-day returns</span>
        </div>
      </div>
    `;
    
    // Related products
    const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
    document.getElementById('relatedProducts').innerHTML = related.length ? `
      <h3>Related Products</h3>
      <div class="products-grid">${related.map(p => this.createProductCard(p)).join('')}</div>
    ` : '';
    
    Navigation.navigateTo('product');
  },

  // Change quantity on product detail page
  changeQty(delta) {
    const input = document.getElementById('detailQty');
    let val = parseInt(input.value) + delta;
    if (val < 1) val = 1;
    if (val > parseInt(input.max)) val = parseInt(input.max);
    input.value = val;
  }
};