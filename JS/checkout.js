/**
 * Smart Zone LK - Checkout Module
 * Handles checkout process and order placement
 */

const Checkout = {
  init() {
    this.setupPaymentMethods();
    this.setupPlaceOrder();
    this.setupContinueShopping();
  },

  // Enforces login before checkout and pre-fills user details
  proceedToCheckout() {
    const userStr = localStorage.getItem('sz_user');
    if (!userStr) {
      DB.showToast('Login Required', 'Please sign in or create an account to proceed to checkout.', 'error');
      Auth.openModal('login');
      return;
    }
    
    const user = JSON.parse(userStr);
    const checkName = document.getElementById('checkName');
    const checkEmail = document.getElementById('checkEmail');
    const checkPhone = document.getElementById('checkPhone');
    
    if (checkName) checkName.value = user.name || '';
    if (checkEmail) checkEmail.value = user.email || '';
    if (checkPhone) checkPhone.value = user.phone || '';
    
    navigateTo('checkout');
  },

  // Render checkout order summary
  renderCheckoutSummary() {
    const cart = DB.getCart();
    const products = DB.getProducts();
    let subtotal = 0;
    let itemsHTML = '';
    
    cart.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return;
      const itemTotal = item.price * item.qty;
      subtotal += itemTotal;
      itemsHTML += `
        <div class="order-item">
          <div class="order-item-image"><i class="fas fa-wifi"></i></div>
          <div class="order-item-info">
            <h4>${product.name}</h4>
            <p>Qty: ${item.qty}</p>
          </div>
          <div class="order-item-price">${DB.formatLKR(itemTotal)}</div>
        </div>
      `;
    });
    
    const delivery = subtotal >= 15000 ? 0 : 350;
    const total = subtotal + delivery;
    
    const summaryEl = document.getElementById('checkoutSummary');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <h3>Order Summary</h3>
        ${itemsHTML}
        <div class="summary-row" style="margin-top:16px;"><span>Subtotal</span><span>${DB.formatLKR(subtotal)}</span></div>
        <div class="summary-row"><span>Delivery</span><span>${delivery === 0 ? 'FREE' : DB.formatLKR(delivery)}</span></div>
        <div class="summary-row total"><span>Total</span><span>${DB.formatLKR(total)}</span></div>
      `;
    }
  },

  // Setup payment method selection
  setupPaymentMethods() {
    document.querySelectorAll('.payment-method').forEach(method => {
      method.addEventListener('click', () => {
        document.querySelectorAll('.payment-method').forEach(m => {
          m.classList.remove('active');
          m.querySelector('input[type="radio"]').checked = false;
        });
        method.classList.add('active');
        method.querySelector('input[type="radio"]').checked = true;
        
        const bankDetails = document.getElementById('bankDetails');
        if (bankDetails) {
          bankDetails.style.display = method.dataset.method === 'bank' ? 'block' : 'none';
        }
      });
    });
  },

  // Setup place order button
  setupPlaceOrder() {
    const btn = document.getElementById('placeOrderBtn');
    if (btn) {
      btn.addEventListener('click', () => this.placeOrder());
    }
  },

  // Setup continue shopping button
  setupContinueShopping() {
    const btn = document.getElementById('continueShoppingBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        document.getElementById('orderConfirmModal').classList.remove('active');
        Navigation.navigateTo('home');
      });
    }
  },

  // Place order
  placeOrder() {
    const name = document.getElementById('checkName').value.trim();
    const phone = document.getElementById('checkPhone').value.trim();
    const email = document.getElementById('checkEmail').value.trim();
    const address = document.getElementById('checkAddress').value.trim();
    const district = document.getElementById('checkDistrict').value;
    const city = document.getElementById('checkCity').value.trim();
    
    // Validation
    if (!name || !phone || !email || !address || !district || !city) {
      DB.showToast('Missing Information', 'Please fill in all required fields.', 'error');
      return;
    }
    
    const cart = DB.getCart();
    if (cart.length === 0) {
      DB.showToast('Empty Cart', 'Your cart is empty.', 'error');
      return;
    }
    
    const products = DB.getProducts();
    let subtotal = 0;
    const orderItems = cart.map(item => {
      const product = products.find(p => p.id === item.productId);
      const itemTotal = item.price * item.qty;
      subtotal += itemTotal;
      return { productId: item.productId, qty: item.qty, price: item.price, name: product ? product.name : 'Unknown' };
    });
    
    const delivery = subtotal >= 15000 ? 0 : 350;
    const payment = document.querySelector('input[name="payment"]:checked').value;
    
    const orders = DB.getOrders();
    const orderId = 'SZ-' + String(orders.length + 6).padStart(3, '0');
    
    const order = {
      id: orderId,
      customer: name,
      email: email,
      phone: phone,
      items: orderItems,
      total: subtotal + delivery,
      payment: payment,
      status: 'pending',
      district: district,
      city: city,
      date: new Date().toISOString().split('T')[0],
      address: address
    };
    
    orders.push(order);
    DB.setOrders(orders);
    
    // Update stock
    let productsData = DB.getProducts();
    cart.forEach(item => {
      const prod = productsData.find(p => p.id === item.productId);
      if (prod) prod.stock = Math.max(0, prod.stock - item.qty);
    });
    DB.setProducts(productsData);
    
    // Clear cart
    DB.setCart([]);
    DB.updateCartBadge();
    
    // Show confirmation
    document.getElementById('confirmOrderId').textContent = 'Order #' + orderId;
    document.getElementById('orderConfirmModal').classList.add('active');
    
    // Clear form
    document.getElementById('checkName').value = '';
    document.getElementById('checkPhone').value = '';
    document.getElementById('checkEmail').value = '';
    document.getElementById('checkAddress').value = '';
    document.getElementById('checkDistrict').value = '';
    document.getElementById('checkCity').value = '';
    document.getElementById('checkPostal').value = '';
    document.getElementById('checkNotes').value = '';
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => Checkout.init());