/**
 * Smart Zone LK - Orders Module
 * Handles customer order history rendering
 */

const Orders = {
  renderCustomerOrders() {
    const userStr = localStorage.getItem('sz_user');
    const container = document.getElementById('customerOrdersContainer');
    
    if (!container) return;

    if (!userStr) {
      container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-lock"></i>
            <h3>Login Required</h3>
            <p>Please sign in to view and manage your orders. If you don't have an account, you can create one easily!</p>
            <button class="btn btn-primary" style="margin-top:20px;" onclick="Auth.openPortal('login')"><i class="fas fa-sign-in-alt"></i> Sign In to Continue</button>
        </div>
      `;
      return;
    }

    const user = JSON.parse(userStr);
    
    if (user.role === 'admin') {
      container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-user-shield"></i>
            <h3>Admin Account Active</h3>
            <p>You are logged in as an administrator. Please use the Admin Dashboard to manage all orders.</p>
            <button class="btn btn-primary" style="margin-top:20px;" onclick="navigateTo('admin')"><i class="fas fa-chart-pie"></i> Go to Dashboard</button>
        </div>
      `;
      return;
    }

    const allOrders = DB.getOrders();
    // Match orders loosely by email, or strictly by customer identifier
    const myOrders = allOrders.filter(o => o.email.toLowerCase() === user.email.toLowerCase());

    if (myOrders.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-box-open"></i>
            <h3>No Orders Yet</h3>
            <p>You haven't placed any orders yet. Discover our latest WiFi and networking gear!</p>
            <button class="btn btn-primary" style="margin-top:20px;" onclick="navigateTo('shop')"><i class="fas fa-store"></i> Start Shopping</button>
        </div>
      `;
      return;
    }

    // Sort orders descending by ID for now, simplest approach assuming ID increases
    myOrders.reverse();

    const getStatusBadge = (status) => {
        const statuses = {
            'pending': '<span style="background:var(--warning-light);color:var(--warning);padding:6px 12px;border-radius:8px;font-size:0.75rem;font-weight:700;text-transform:uppercase;">Pending</span>',
            'processing': '<span style="background:var(--primary-light);color:var(--primary);padding:6px 12px;border-radius:8px;font-size:0.75rem;font-weight:700;text-transform:uppercase;">Processing</span>',
            'shipped': '<span style="background:#E0F2F1;color:#009688;padding:6px 12px;border-radius:8px;font-size:0.75rem;font-weight:700;text-transform:uppercase;">Shipped</span>',
            'delivered': '<span style="background:var(--success-light);color:var(--success);padding:6px 12px;border-radius:8px;font-size:0.75rem;font-weight:700;text-transform:uppercase;">Delivered</span>',
            'cancelled': '<span style="background:var(--danger-light);color:var(--danger);padding:6px 12px;border-radius:8px;font-size:0.75rem;font-weight:700;text-transform:uppercase;">Cancelled</span>',
            'confirmed': '<span style="background:var(--success-light);color:var(--success);padding:6px 12px;border-radius:8px;font-size:0.75rem;font-weight:700;text-transform:uppercase;">Confirmed</span>'
        };
        return statuses[status.toLowerCase()] || statuses['pending'];
    };

    const getPaymentBadge = (payment) => {
        const methods = {
            'cod': 'Cash on Delivery',
            'bank': 'Bank Transfer',
            'online': 'Online Payment'
        };
        return `<span style="font-size:0.85rem;color:var(--gray-500);display:flex;align-items:center;gap:6px;"><i class="fas fa-credit-card"></i> ${methods[payment] || 'Unknown'}</span>`;
    };

    container.innerHTML = `
        <div class="orders-list" style="display:grid;gap:24px;">
            ${myOrders.map(order => `
                <div class="order-history-card" style="background:white;border:1px solid var(--gray-200);border-radius:20px;padding:24px;box-shadow:var(--shadow-sm);transition:var(--transition);">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;margin-bottom:24px;border-bottom:1px solid var(--gray-100);padding-bottom:20px;">
                        <div>
                            <div style="font-size:1.2rem;font-weight:800;color:var(--dark);margin-bottom:6px;">Order #${order.id}</div>
                            <div style="font-size:0.9rem;color:var(--gray-500);margin-bottom:8px;"><i class="far fa-calendar-alt"></i> Placed on ${order.date}</div>
                            ${getPaymentBadge(order.payment)}
                        </div>
                        <div style="text-align:right;">
                            <div style="margin-bottom:12px;display:flex;justify-content:flex-end;">${getStatusBadge(order.status)}</div>
                            <div style="font-size:1.3rem;font-weight:900;color:var(--primary);">${DB.formatLKR(order.total)}</div>
                        </div>
                    </div>
                    
                    <div class="order-items-list" style="display:grid;gap:12px;">
                        ${order.items.map(item => {
                            const product = DB.getProducts().find(p => p.id === item.productId);
                            if (!product) return '';
                            return `
                                <div style="display:flex;gap:16px;align-items:center;background:var(--gray-50);padding:16px;border-radius:16px;border:1px solid var(--gray-100);">
                                    <div style="width:48px;height:48px;background:white;border-radius:12px;display:flex;align-items:center;justify-content:center;color:var(--gray-300);flex-shrink:0;box-shadow:var(--shadow-sm);">
                                        <i class="fas fa-wifi"></i>
                                    </div>
                                    <div style="flex:1;">
                                        <div style="font-size:0.95rem;font-weight:700;color:var(--dark);margin-bottom:4px;">${product.name}</div>
                                        <div style="font-size:0.85rem;color:var(--gray-500);">Qty: ${item.qty} × ${DB.formatLKR(item.price)}</div>
                                    </div>
                                    <div style="font-size:1rem;font-weight:800;color:var(--dark);">
                                        ${DB.formatLKR(item.qty * item.price)}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    ${order.trackingNumber && (order.status === 'shipped' || order.status === 'delivered') ? `
                        <div style="margin-top:20px;padding:16px;background:var(--primary-light);border-radius:12px;border:1px solid var(--primary);">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                                <i class="fas fa-truck" style="color:var(--primary);"></i>
                                <span style="font-weight:700;color:var(--primary);">Tracking Information</span>
                            </div>
                            <div style="display:grid;gap:8px;font-size:0.9rem;">
                                <div style="display:flex;justify-content:space-between;">
                                    <span style="color:var(--gray-600);">Carrier:</span>
                                    <span style="font-weight:600;color:var(--dark);">${order.carrier}</span>
                                </div>
                                <div style="display:flex;justify-content:space-between;">
                                    <span style="color:var(--gray-600);">Tracking Number:</span>
                                    <span style="font-weight:600;color:var(--dark);font-family:monospace;">${order.trackingNumber}</span>
                                </div>
                                ${order.estimatedDelivery ? `
                                    <div style="display:flex;justify-content:space-between;">
                                        <span style="color:var(--gray-600);">Est. Delivery:</span>
                                        <span style="font-weight:600;color:var(--dark);">${order.estimatedDelivery}</span>
                                    </div>
                                ` : ''}
                            </div>
                            ${order.trackingUrl ? `
                                <button class="btn btn-primary btn-sm" style="margin-top:12px;width:100%;" onclick="window.open('${order.trackingUrl}', '_blank')">
                                    <i class="fas fa-external-link-alt"></i> Track Package
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    <div style="margin-top:24px;display:flex;justify-content:flex-end;gap:12px;">
                        <button class="btn btn-outline btn-sm" style="border-color:var(--gray-200);color:var(--gray-700);background:white;" onclick="DB.showToast('Support','Loading support for order #${order.id}...','info')"><i class="fas fa-headset"></i> Get Help</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
  }
};
