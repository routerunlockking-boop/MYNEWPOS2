// Test script to add a sample product with image
const testProduct = {
    name: "Test Router with Image",
    brand: "TP-Link",
    category: "Home Routers",
    wifi: "WiFi 6",
    price: 15990,
    salePrice: 12990,
    stock: 25,
    speed: "AX3000 (2402 + 574 Mbps)",
    coverage: "Up to 1500 sq ft",
    description: "Test product with uploaded image functionality",
    specs: {
        "WiFi Standard": "WiFi 6 (802.11ax)",
        "Speed": "AX3000",
        "Ports": "4x Gigabit LAN",
        "Antennas": "4x External"
    },
    // Using a simple SVG as test image
    imgUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDA3YmZmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlRlc3QgSW1hZ2U8L3RleHQ+PC9zdmc+"
};

console.log('Test product created:', testProduct);
console.log('Image URL type:', typeof testProduct.imgUrl);
console.log('Image URL length:', testProduct.imgUrl.length);

// Function to simulate adding this product
function addTestProduct() {
    const products = JSON.parse(localStorage.getItem('sz_products') || '[]');
    testProduct.id = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    testProduct.rating = 4.5;
    testProduct.reviews = 0;
    testProduct.badge = testProduct.salePrice ? 'sale' : '';
    testProduct.isNew = !testProduct.salePrice;
    testProduct.isHot = false;
    
    products.push(testProduct);
    localStorage.setItem('sz_products', JSON.stringify(products));
    
    console.log('Test product added successfully!');
    console.log('Total products now:', products.length);
    
    return testProduct;
}

// Auto-run test
if (typeof window !== 'undefined') {
    window.addTestProduct = addTestProduct;
    console.log('Test function ready. Call addTestProduct() to add test product with image.');
}
