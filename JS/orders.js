/**
 * Smart Zone LK - Orders Module
 * Handles customer order history rendering
 */

const Orders = {
  // Show tracking timeline modal
  showTrackingTimeline(orderId) {
    const orders = DB.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.trackingHistory) return;
    
    const modal = this.createTrackingTimelineModal(order);
    document.body.appendChild(modal);
    modal.classList.add('active');
  },

  // Create tracking timeline modal
  createTrackingTimelineModal(order) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'trackingTimelineModal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h3><i class="fas fa-history"></i> Tracking Timeline - Order ${order.id}</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div style="background:var(--primary-light);padding:16px;border-radius:8px;margin-bottom:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span style="font-weight:600;color:var(--primary);">${order.carrier}</span>
              <span style="font-family:monospace;font-size:0.85rem;color:var(--dark);">${order.trackingNumber}</span>
            </div>
            ${order.estimatedDelivery ? `
              <div style="font-size:0.85rem;color:var(--gray-600);">
                <i class="fas fa-calendar"></i> Estimated Delivery: ${order.estimatedDelivery}
              </div>
            ` : ''}
          </div>
          
          <div class="tracking-timeline">
            ${order.trackingHistory.map((event, index) => `
              <div class="timeline-item ${index === order.trackingHistory.length - 1 ? 'timeline-item-active' : ''}">
                <div class="timeline-marker">
                  <div class="timeline-dot"></div>
                  ${index < order.trackingHistory.length - 1 ? '<div class="timeline-line"></div>' : ''}
                </div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <div class="timeline-status">${event.status}</div>
                    <div class="timeline-time">${this.formatDateTime(event.timestamp)}</div>
                  </div>
                  <div class="timeline-location">
                    <i class="fas fa-map-marker-alt"></i> ${event.location}
                  </div>
                  <div class="timeline-description">${event.description}</div>
                </div>
              </div>
            `).join('')}
          </div>
          
          ${order.trackingUrl ? `
            <div style="margin-top:20px;text-align:center;">
              <button class="btn btn-primary" onclick="window.open('${order.trackingUrl}', '_blank')">
                <i class="fas fa-external-link-alt"></i> Track on Carrier Website
              </button>
            </div>
          ` : ''}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">Close</button>
          <button type="button" class="btn btn-primary" onclick="Orders.downloadTrackingInfo('${order.id}')">
            <i class="fas fa-download"></i> Download Tracking Info
          </button>
        </div>
      </div>
    `;
    return modal;
  },

  // Format date and time for timeline
  formatDateTime(timestamp) {
    const date = new Date(timestamp);
    const options = { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
  },

  // Download tracking information
  downloadTrackingInfo(orderId) {
    const orders = DB.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    let trackingText = `Tracking Information for Order ${order.id}\n`;
    trackingText += `=====================================\n\n`;
    trackingText += `Order Details:\n`;
    trackingText += `Customer: ${order.customer}\n`;
    trackingText += `Email: ${order.email}\n`;
    trackingText += `Phone: ${order.phone}\n`;
    trackingText += `Address: ${order.address}\n\n`;
    
    trackingText += `Shipping Information:\n`;
    trackingText += `Carrier: ${order.carrier}\n`;
    trackingText += `Tracking Number: ${order.trackingNumber}\n`;
    trackingText += `Estimated Delivery: ${order.estimatedDelivery || 'N/A'}\n`;
    trackingText += `Tracking URL: ${order.trackingUrl || 'N/A'}\n\n`;
    
    trackingText += `Tracking History:\n`;
    trackingText += `-----------------\n`;
    
    if (order.trackingHistory && order.trackingHistory.length > 0) {
      order.trackingHistory.forEach(event => {
        const date = new Date(event.timestamp);
        const formattedDate = date.toLocaleString();
        trackingText += `\n${formattedDate}\n`;
        trackingText += `Status: ${event.status}\n`;
        trackingText += `Location: ${event.location}\n`;
        trackingText += `Description: ${event.description}\n`;
        trackingText += `-----------------\n`;
      });
    } else {
      trackingText += 'No tracking history available.\n';
    }
    
    trackingText += `\nGenerated on: ${new Date().toLocaleString()}\n`;
    trackingText += `Smart Zone LK - Order Tracking System`;
    
    // Create and download file
    const blob = new Blob([trackingText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracking_${order.id}_${order.trackingNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    DB.showToast('Download Complete', `Tracking info downloaded for ${order.id}`, 'success');
  },

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
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                                <i class="fas fa-truck" style="color:var(--primary);"></i>
                                <span style="font-weight:700;color:var(--primary);">Tracking Information</span>
                                ${order.trackingHistory && order.trackingHistory.length > 0 ? `
                                    <span style="margin-left:auto;font-size:0.75rem;color:var(--success);font-weight:600;">
                                        <i class="fas fa-circle"></i> ${order.trackingHistory.length} Updates
                                    </span>
                                ` : ''}
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
                                ${order.trackingHistory && order.trackingHistory.length > 0 ? `
                                    <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--gray-200);">
                                        <div style="color:var(--gray-600);font-size:0.8rem;margin-bottom:4px;">Latest Update</div>
                                        <div style="font-weight:600;color:var(--primary);">${order.trackingHistory[order.trackingHistory.length - 1].status}</div>
                                        <div style="font-size:0.8rem;color:var(--gray-600);margin-top:2px;">
                                            <i class="fas fa-map-marker-alt"></i> ${order.trackingHistory[order.trackingHistory.length - 1].location} • ${this.formatDateTime(order.trackingHistory[order.trackingHistory.length - 1].timestamp)}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                            <div style="display:flex;gap:8px;margin-top:12px;">
                                ${order.trackingUrl ? `
                                    <button class="btn btn-primary btn-sm" style="flex:1;" onclick="window.open('${order.trackingUrl}', '_blank')">
                                        <i class="fas fa-external-link-alt"></i> Track on Carrier Site
                                    </button>
                                ` : ''}
                                <button class="btn btn-outline btn-sm" style="flex:1;" onclick="Orders.showTrackingTimeline('${order.id}')">
                                    <i class="fas fa-history"></i> View Full Timeline
                                </button>
                            </div>
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
