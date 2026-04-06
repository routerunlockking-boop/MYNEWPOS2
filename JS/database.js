/**
 * Smart Zone LK - Database Module
 * Handles all data storage and retrieval using localStorage
 */

const DB = {
  // Default product catalog
  DEFAULT_PRODUCTS: [
    {
      id: 1, name: "TP-Link Archer AX73", brand: "TP-Link", category: "Home Routers",
      wifi: "WiFi 6", speed: "AX5400", coverage: "Up to 2500 sq ft",
      price: 24990, salePrice: 19990, stock: 45, rating: 4.8, reviews: 234,
      badge: "sale", isNew: false, isHot: true,
      description: "The TP-Link Archer AX73 is a powerful WiFi 6 router designed for modern homes. With AX5400 dual-band speeds, it delivers ultra-fast connections for streaming, gaming, and working from home. Features OFDMA and MU-MIMO technology for efficient data transmission to multiple devices simultaneously.",
      specs: { "WiFi Standard": "WiFi 6 (802.11ax)", "Speed": "AX5400 (4804 + 574 Mbps)", "Coverage": "Up to 2500 sq ft", "Devices": "Up to 200 devices", "Ports": "1x Gigabit WAN, 4x Gigabit LAN, 1x USB 3.0", "Antennas": "6x External High-Gain", "Processor": "1.5 GHz Tri-Core", "Security": "WPA3, HomeShield", "MU-MIMO": "Yes (4x4)", "OFDMA": "Yes" }
    },
    {
      id: 2, name: "ASUS RT-AX86U Pro", brand: "ASUS", category: "Gaming Routers",
      wifi: "WiFi 6", speed: "AX5700", coverage: "Up to 3000 sq ft",
      price: 49990, salePrice: 42990, stock: 18, rating: 4.9, reviews: 189,
      badge: "hot", isNew: false, isHot: true,
      description: "The ASUS RT-AX86U Pro is a premium gaming WiFi 6 router with dedicated Game Boost and Adaptive QoS. Featuring a 2.5G WAN port and powerful hardware, it's perfect for competitive gaming and heavy network usage.",
      specs: { "WiFi Standard": "WiFi 6 (802.11ax)", "Speed": "AX5700 (4804 + 861 Mbps)", "Coverage": "Up to 3000 sq ft", "Devices": "Unlimited", "Ports": "1x 2.5G WAN, 4x Gigabit LAN, 1x USB 3.1", "Antennas": "4x External + Internal", "Processor": "2.0 GHz Quad-Core", "Security": "AiProtection Pro", "Game Boost": "Yes", "Adaptive QoS": "Yes" }
    },
    {
      id: 3, name: "Huawei WiFi AX3", brand: "Huawei", category: "Home Routers",
      wifi: "WiFi 6", speed: "AX3000", coverage: "Up to 1800 sq ft",
      price: 12990, salePrice: 9990, stock: 67, rating: 4.5, reviews: 312,
      badge: "sale", isNew: false, isHot: false,
      description: "Huawei WiFi AX3 is an affordable WiFi 6 router perfect for small to medium homes. With NFC one-tap connection and gigabit ports, it provides reliable connectivity at a budget-friendly price.",
      specs: { "WiFi Standard": "WiFi 6 (802.11ax)", "Speed": "AX3000 (2402 + 574 Mbps)", "Coverage": "Up to 1800 sq ft", "Devices": "Up to 128 devices", "Ports": "4x Gigabit LAN/WAN", "Antennas": "4x Internal", "Processor": "1.4 GHz Quad-Core", "Security": "WPA3", "NFC": "One-tap Connect", "Mesh": "HarmonyOS Mesh" }
    },
    {
      id: 4, name: "Xiaomi Router AX3000T", brand: "Xiaomi", category: "Home Routers",
      wifi: "WiFi 6", speed: "AX3000", coverage: "Up to 2000 sq ft",
      price: 11990, salePrice: 9490, stock: 89, rating: 4.4, reviews: 445,
      badge: "sale", isNew: false, isHot: true,
      description: "Xiaomi Router AX3000T offers incredible value with WiFi 6 technology. Perfect for everyday internet use, streaming, and light gaming with reliable dual-band performance.",
      specs: { "WiFi Standard": "WiFi 6 (802.11ax)", "Speed": "AX3000 (2402 + 574 Mbps)", "Coverage": "Up to 2000 sq ft", "Devices": "Up to 254 devices", "Ports": "3x Gigabit LAN, 1x WAN", "Antennas": "4x External", "Processor": "Quad-Core 1.3 GHz", "Security": "WPA3", "App Control": "Mi WiFi App", "Mesh": "Yes" }
    },
    {
      id: 5, name: "TP-Link Deco X50 (3-Pack)", brand: "TP-Link", category: "Mesh Systems",
      wifi: "WiFi 6", speed: "AX3000", coverage: "Up to 6500 sq ft",
      price: 45990, salePrice: 38990, stock: 22, rating: 4.7, reviews: 156,
      badge: "sale", isNew: false, isHot: false,
      description: "TP-Link Deco X50 mesh system eliminates WiFi dead zones with seamless whole-home coverage. 3-pack covers up to 6500 sq ft with unified network name and intelligent roaming.",
      specs: { "WiFi Standard": "WiFi 6 (802.11ax)", "Speed": "AX3000 (2402 + 574 Mbps)", "Coverage": "Up to 6500 sq ft (3-pack)", "Devices": "Up to 150 devices", "Ports": "3x Gigabit per unit", "Backhaul": "Dedicated wireless", "Security": "HomeShield", "App Control": "Deco App", "Voice Control": "Alexa Compatible", "Setup": "Easy in minutes" }
    },
    {
      id: 6, name: "Netgear Orbi RBK753", brand: "Netgear", category: "Mesh Systems",
      wifi: "WiFi 6", speed: "AX4200", coverage: "Up to 7500 sq ft",
      price: 79990, salePrice: 69990, stock: 8, rating: 4.6, reviews: 87,
      badge: "sale", isNew: false, isHot: false,
      description: "Netgear Orbi RBK753 is a premium tri-band mesh WiFi 6 system delivering blazing-fast speeds across large homes. Dedicated backhaul ensures consistent performance.",
      specs: { "WiFi Standard": "WiFi 6 (802.11ax)", "Speed": "AX4200 Tri-Band", "Coverage": "Up to 7500 sq ft", "Devices": "Up to 40 devices", "Ports": "4x Gigabit per unit", "Backhaul": "Dedicated 5GHz band", "Security": "NETGEAR Armor", "App Control": "Orbi App", "Voice Control": "Alexa & Google", "Smart Connect": "Yes" }
    },
    {
      id: 7, name: "ASUS ROG Rapture GT-AX11000 Pro", brand: "ASUS", category: "Gaming Routers",
      wifi: "WiFi 6", speed: "AX11000", coverage: "Up to 3500 sq ft",
      price: 89990, salePrice: 79990, stock: 5, rating: 4.9, reviews: 67,
      badge: "hot", isNew: false, isHot: true,
      description: "The ultimate gaming router. ASUS ROG Rapture GT-AX11000 Pro delivers tri-band WiFi 6 with 10Gbps WAN port, dedicated gaming port, and advanced gaming features for competitive play.",
      specs: { "WiFi Standard": "WiFi 6 (802.11ax)", "Speed": "AX11000 Tri-Band", "Coverage": "Up to 3500 sq ft", "Devices": "Unlimited", "Ports": "1x 10G WAN, 1x 2.5G LAN, 4x Gigabit", "Antennas": "8x External", "Processor": "2.0 GHz Quad-Core", "Security": "AiProtection Pro", "Game Radar": "Yes", "GeoFilter": "Yes" }
    },
    {
      id: 8, name: "Mercusys Halo H80X (2-Pack)", brand: "Mercusys", category: "Mesh Systems",
      wifi: "WiFi 6", speed: "AX3000", coverage: "Up to 4800 sq ft",
      price: 24990, salePrice: 19990, stock: 34, rating: 4.3, reviews: 198,
      badge: "sale", isNew: false, isHot: false,
      description: "Mercusys Halo H80X provides affordable whole-home WiFi 6 mesh coverage. Easy setup with the Halo app and seamless roaming throughout your home.",
      specs: { "WiFi Standard": "WiFi 6 (802.11ax)", "Speed": "AX3000 (2402 + 574 Mbps)", "Coverage": "Up to 4800 sq ft (2-pack)", "Devices": "Up to 100 devices", "Ports": "3x Gigabit per unit", "Backhaul": "Dedicated wireless", "Security": "WPA3", "App Control": "Halo App", "IPTV": "Yes", "Parental Controls": "Yes" }
    },
    {
      id: 9, name: "TP-Link Archer BE900", brand: "TP-Link", category: "Gaming Routers",
      wifi: "WiFi 7", speed: "BE19000", coverage: "Up to 4000 sq ft",
      price: 129990, salePrice: 109990, stock: 3, rating: 5.0, reviews: 12,
      badge: "new", isNew: true, isHot: true,
      description: "Experience the future with WiFi 7. The TP-Link Archer BE900 delivers unprecedented speeds up to 19 Gbps with 4K-QAM and Multi-Link Operation for the most demanding applications.",
      specs: { "WiFi Standard": "WiFi 7 (802.11be)", "Speed": "BE19000 Tri-Band", "Coverage": "Up to 4000 sq ft", "Devices": "Unlimited", "Ports": "2x 10G, 4x 2.5G LAN", "Antennas": "12x Internal + External", "Processor": "2.6 GHz Quad-Core", "Security": "HomeShield Pro", "MLO": "Multi-Link Operation", "4K-QAM": "Yes" }
    },
    {
      id: 10, name: "Huawei WiFi 653 (AX3000)", brand: "Huawei", category: "Home Routers",
      wifi: "WiFi 6", speed: "AX3000", coverage: "Up to 2200 sq ft",
      price: 14990, salePrice: 11990, stock: 56, rating: 4.5, reviews: 267,
      badge: "sale", isNew: false, isHot: false,
      description: "Huawei WiFi 653 delivers reliable WiFi 6 performance with intelligent network acceleration and HarmonyOS Mesh technology for seamless whole-home coverage.",
      specs: { "WiFi Standard": "WiFi 6 (802.11ax)", "Speed": "AX3000", "Coverage": "Up to 2200 sq ft", "Devices": "Up to 128 devices", "Ports": "4x Gigabit", "Antennas": "4x Internal", "Processor": "Dual-Core 1.4 GHz", "Security": "WPA3", "NFC": "One-tap Connect", "Mesh": "HarmonyOS Mesh+" }
    },
    {
      id: 11, name: "TP-Link Omada EAP610", brand: "TP-Link", category: "Enterprise",
      wifi: "WiFi 6", speed: "AX1800", coverage: "Up to 2000 sq ft",
      price: 19990, salePrice: 16990, stock: 28, rating: 4.6, reviews: 89,
      badge: "", isNew: false, isHot: false,
      description: "TP-Link Omada EAP610 is a ceiling-mount WiFi 6 access point designed for businesses and offices. Centralized management through Omada SDN controller.",
      specs: { "WiFi Standard": "WiFi 6 (802.11ax)", "Speed": "AX1800 (1201 + 574 Mbps)", "Coverage": "Up to 2000 sq ft", "Devices": "Up to 200 clients", "Ports": "1x Gigabit, PoE", "Mounting": "Ceiling/Wall", "Management": "Omada SDN", "PoE": "802.3af/at", "VLAN": "Yes", "Captive Portal": "Yes" }
    },
    {
      id: 12, name: "Cat6 Ethernet Cable (10m)", brand: "TP-Link", category: "Accessories",
      wifi: "", speed: "10 Gbps", coverage: "",
      price: 1990, salePrice: 1490, stock: 150, rating: 4.7, reviews: 567,
      badge: "sale", isNew: false, isHot: false,
      description: "High-quality Cat6 Ethernet cable for reliable wired connections. Gold-plated RJ45 connectors, snagless boot design. Perfect for connecting routers, PCs, and gaming consoles.",
      specs: { "Category": "Cat6", "Length": "10 meters", "Speed": "Up to 10 Gbps", "Bandwidth": "250 MHz", "Connector": "RJ45 Gold-plated", "Shielding": "UTP", "Cable Type": "Pure Copper", "Boot Type": "Snagless", "Color": "Blue", "Warranty": "Lifetime" }
    }
  ],

  DEFAULT_ORDERS: [
    { 
      id: 'SZ-001', 
      customer: 'Kamal Perera', 
      email: 'kamal@email.com', 
      phone: '+94 77 123 4567', 
      items: [{productId:1,qty:1,price:19990}], 
      total: 20340, 
      payment: 'cod', 
      status: 'delivered', 
      district: 'Colombo', 
      city: 'Colombo', 
      date: '2025-01-10', 
      address: 'No. 45, Galle Road, Colombo 03', 
      trackingNumber: 'SLP001234567', 
      carrier: 'Sri Lanka Post', 
      trackingUrl: 'https://www.srilankapost.gov.lk/track', 
      estimatedDelivery: '2025-01-12',
      trackingHistory: [
        { 
          timestamp: '2025-01-10T14:30:00', 
          status: 'Order Confirmed', 
          location: 'Colombo Sorting Center', 
          description: 'Order received and processed'
        },
        { 
          timestamp: '2025-01-11T09:15:00', 
          status: 'Package Dispatched', 
          location: 'Colombo Main Office', 
          description: 'Package handed over to Sri Lanka Post'
        },
        { 
          timestamp: '2025-01-11T16:45:00', 
          status: 'In Transit', 
          location: 'Gampaha Distribution Hub', 
          description: 'Package in transit to destination'
        },
        { 
          timestamp: '2025-01-12T08:30:00', 
          status: 'Out for Delivery', 
          location: 'Colombo 03 Post Office', 
          description: 'Package out for delivery'
        },
        { 
          timestamp: '2025-01-12T14:20:00', 
          status: 'Delivered', 
          location: 'Customer Address', 
          description: 'Package successfully delivered to recipient'
        }
      ]
    },
    { 
      id: 'SZ-002', 
      customer: 'Nimali Silva', 
      email: 'nimali@email.com', 
      phone: '+94 71 234 5678', 
      items: [{productId:4,qty:2,price:9490}], 
      total: 19330, 
      payment: 'bank', 
      status: 'shipped', 
      district: 'Kandy', 
      city: 'Kandy', 
      date: '2025-01-12', 
      address: 'No. 12, Temple Road, Kandy', 
      trackingNumber: 'DHL789012345', 
      carrier: 'DHL Express', 
      trackingUrl: 'https://www.dhl.com/en/express/tracking.html', 
      estimatedDelivery: '2025-01-18',
      trackingHistory: [
        { 
          timestamp: '2025-01-12T11:00:00', 
          status: 'Order Confirmed', 
          location: 'Smart Zone Warehouse', 
          description: 'Order confirmed and payment verified'
        },
        { 
          timestamp: '2025-01-13T10:30:00', 
          status: 'Package Picked Up', 
          location: 'DHL Express Colombo', 
          description: 'Package picked up by DHL courier'
        },
        { 
          timestamp: '2025-01-13T15:45:00', 
          status: 'In Transit', 
          location: 'DHL Hub Colombo', 
          description: 'Package processed at DHL facility'
        },
        { 
          timestamp: '2025-01-14T08:00:00', 
          status: 'In Transit', 
          location: 'DHL Hub Kandy', 
          description: 'Package arrived at destination hub'
        },
        { 
          timestamp: '2025-01-15T09:30:00', 
          status: 'Out for Delivery', 
          location: 'Kandy Distribution Center', 
          description: 'Package with local courier for delivery'
        }
      ]
    },
    { id: 'SZ-003', customer: 'Ruvini Fernando', email: 'ruvini@email.com', phone: '+94 76 345 6789', items: [{productId:5,qty:1,price:38990}], total: 38990, payment: 'cod', status: 'processing', district: 'Galle', city: 'Galle', date: '2025-01-14', address: 'No. 78, Lighthouse Street, Galle', trackingNumber: '', carrier: '', trackingUrl: '', estimatedDelivery: '' },
    { id: 'SZ-004', customer: 'Saman Kumara', email: 'saman@email.com', phone: '+94 70 456 7890', items: [{productId:7,qty:1,price:79990},{productId:12,qty:2,price:1490}], total: 83620, payment: 'online', status: 'confirmed', district: 'Jaffna', city: 'Jaffna', date: '2025-01-15', address: 'No. 23, Main Street, Jaffna', trackingNumber: '', carrier: '', trackingUrl: '', estimatedDelivery: '' },
    { id: 'SZ-005', customer: 'Dilshan Rajapaksa', email: 'dilshan@email.com', phone: '+94 72 567 8901', items: [{productId:9,qty:1,price:109990}], total: 109990, payment: 'cod', status: 'pending', district: 'Colombo', city: 'Nugegoda', date: '2025-01-16', address: 'No. 56, High Level Road, Nugegoda', trackingNumber: '', carrier: '', trackingUrl: '', estimatedDelivery: '' }
  ],

  DEFAULT_CUSTOMERS: [
    { name: 'Kamal Perera', email: 'kamal@email.com', phone: '+94 77 123 4567', orders: 3, totalSpent: 54750, registered: '2024-06-15' },
    { name: 'Nimali Silva', email: 'nimali@email.com', phone: '+94 71 234 5678', orders: 2, totalSpent: 32460, registered: '2024-08-20' },
    { name: 'Ruvini Fernando', email: 'ruvini@email.com', phone: '+94 76 345 6789', orders: 1, totalSpent: 39340, registered: '2024-11-05' },
    { name: 'Saman Kumara', email: 'saman@email.com', phone: '+94 70 456 7890', orders: 2, totalSpent: 83620, registered: '2024-09-12' },
    { name: 'Dilshan Rajapaksa', email: 'dilshan@email.com', phone: '+94 72 567 8901', orders: 1, totalSpent: 110640, registered: '2025-01-16' }
  ],

  // Initialize database with default data
  init() {
    if (!localStorage.getItem('sz_products')) {
      localStorage.setItem('sz_products', JSON.stringify(this.DEFAULT_PRODUCTS));
    }
    if (!localStorage.getItem('sz_orders')) {
      localStorage.setItem('sz_orders', JSON.stringify(this.DEFAULT_ORDERS));
    }
    if (!localStorage.getItem('sz_customers')) {
      localStorage.setItem('sz_customers', JSON.stringify(this.DEFAULT_CUSTOMERS));
    }
    if (!localStorage.getItem('sz_cart')) {
      localStorage.setItem('sz_cart', JSON.stringify([]));
    }
  },

  // Products
  getProducts() {
    return JSON.parse(localStorage.getItem('sz_products') || '[]');
  },
  setProducts(products) {
    localStorage.setItem('sz_products', JSON.stringify(products));
  },

  // Orders
  getOrders() {
    return JSON.parse(localStorage.getItem('sz_orders') || '[]');
  },
  setOrders(orders) {
    localStorage.setItem('sz_orders', JSON.stringify(orders));
  },

  // Cart
  getCart() {
    return JSON.parse(localStorage.getItem('sz_cart') || '[]');
  },
  setCart(cart) {
    localStorage.setItem('sz_cart', JSON.stringify(cart));
  },

  // Customers
  getCustomers() {
    return JSON.parse(localStorage.getItem('sz_customers') || '[]');
  },

  // Utility: Format LKR currency
  formatLKR(num) {
    return 'LKR ' + Number(num).toLocaleString('en-LK');
  },

  // Utility: Toast notification
  showToast(title, message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    const iconClass = type === 'success' ? 'fa-check' : type === 'error' ? 'fa-times' : 'fa-info';
    toast.innerHTML = `
      <div class="toast-icon ${type}"><i class="fas ${iconClass}"></i></div>
      <div class="toast-content"><h4>${title}</h4><p>${message}</p></div>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

  // Utility: Update cart badge
  updateCartBadge() {
    const cart = this.getCart();
    const total = cart.reduce((sum, item) => sum + item.qty, 0);
    const badge = document.getElementById('cartBadge');
    if (badge) badge.textContent = total;
    
    const bottomBadge = document.getElementById('bottomCartBadge');
    if (bottomBadge) {
        bottomBadge.textContent = total;
        bottomBadge.style.display = total > 0 ? 'flex' : 'none';
    }
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  DB.init();
  DB.updateCartBadge();
});