/**
 * Smart Zone LK - Cart Module
 * Handles shopping cart operations
 */

const Cart = {
  // Add product to cart
  addToCart(productId, qty = 1) {
    const products = DB.getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    let cart = DB.getCart();
    const existing = cart.find(item => item.productId === productId);
    
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ productId, qty, price: product.salePrice || product.price });
    }
    
    DB.setCart(cart);
    DB.updateCartBadge();
    DB.showToast('Added to Cart', `${product.name} added to cart`, 'success');
  },

  // Remove product from cart
  removeFromCart(productId) {
    let cart = DB.getCart().filter(item => item.productId !== productId);
    DB.setCart(cart);
    DB.updateCartBadge();
    this.renderCart();
  },

  // Update cart item quantity
  updateCartQty(productId, qty) {
    if (qty < 1) return;
    let cart = DB.getCart();
    const item = cart.find(i => i.productId === productId);
    if (item) {
      item.qty = qty;
      DB.setCart(cart);
      DB.updateCartBadge();
      this.renderCart();
    }
  },

  // Render cart page
  renderCart() {
    const cart = DB.getCart();
    const products = DB.getProducts();
    const container = document.getElementById('cartContent');
    
    if (cart.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-shopping-cart"></i>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added any products to your cart yet.</p>
          <button class="btn btn-primary" onclick="navigateTo('shop')"><i class="fas fa-store"></i> Start Shopping</button>
        </div>
      `;
      return;
    }
    
    let subtotal = 0;
    let itemsHTML = '';
    
    cart.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return;
      const itemTotal = item.price * item.qty;
      subtotal += itemTotal;
      
      itemsHTML += `
        <div class="cart-item">
          <div class="cart-item-image"><i class="fas fa-wifi"></i></div>
          <div class="cart-item-info">
            <h3>${product.name}</h3>
            <div class="brand">${product.brand}</div>
            <div class="price">${DB.formatLKR(item.price)}</div>
          </div>
          <div class="cart-item-actions">
            <div class="qty-controls">
              <button class="qty-btn" onclick="Cart.updateCartQty(${item.productId}, ${item.qty - 1})">−</button>
              <input type="number" class="qty-input" value="${item.qty}" min="1" onchange="Cart.updateCartQty(${item.productId}, parseInt(this.value))">
              <button class="qty-btn" onclick="Cart.updateCartQty(${item.productId}, ${item.qty + 1})">+</button>
            </div>
            <button class="remove-btn" onclick="Cart.removeFromCart(${item.productId})"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `;
    });
    
    const delivery = subtotal >= 15000 ? 0 : 350;
    const total = subtotal + delivery;
    
    container.innerHTML = `
      <div class="cart-layout">
        <div class="cart-items">${itemsHTML}</div>
        <div class="cart-summary">
          <h3>Order Summary</h3>
          <div class="summary-row"><span>Subtotal</span><span>${DB.formatLKR(subtotal)}</span></div>
          <div class="summary-row"><span>Delivery</span><span>${delivery === 0 ? '<span style="color:var(--success);font-weight:600;">FREE</span>' : DB.formatLKR(delivery)}</span></div>
          ${delivery === 0 ? '<div style="font-size:0.8rem;color:var(--success);text-align:right;">✓ Free delivery applied!</div>' : ''}
          <div class="summary-row total"><span>Total</span><span>${DB.formatLKR(total)}</span></div>
          <div class="promo-code">
            <input type="text" placeholder="Promo code">
            <button onclick="DB.showToast('Promo Code','Invalid promo code','error')">Apply</button>
          </div>
          <button class="btn btn-primary btn-lg" onclick="navigateTo('checkout')"><i class="fas fa-lock"></i> Proceed to Checkout</button>
          <button class="btn btn-ghost" style="width:100%;justify-content:center;margin-top:8px;" onclick="navigateTo('shop')"><i class="fas fa-arrow-left"></i> Continue Shopping</button>
        </div>
      </div>
    `;
  }
};