/**
 * DATA.JS
 * Handles all data operations including localStorage management
 * and order data structure
 */

// Order status constants
const ORDER_STATUS = {
    PLACED: 0,
    PACKED: 1,
    SHIPPED: 2,
    DELIVERED: 3
};

// Status labels for display
const STATUS_LABELS = {
    0: 'Order Placed',
    1: 'Packed',
    2: 'Shipped',
    3: 'Delivered'
};

// Status badge classes for styling
const STATUS_CLASSES = {
    0: 'placed',
    1: 'packed',
    2: 'shipped',
    3: 'delivered'
};

// localStorage key
const STORAGE_KEY = 'orderTrackingOrders';

/**
 * Generate a unique order ID
 * Format: ORD + timestamp + random number
 */
function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD${timestamp}${random}`;
}

/**
 * Get all orders from localStorage
 * @returns {Array} Array of order objects
 */
function getOrders() {
    try {
        const orders = localStorage.getItem(STORAGE_KEY);
        return orders ? JSON.parse(orders) : [];
    } catch (error) {
        console.error('Error reading orders from localStorage:', error);
        return [];
    }
}

/**
 * Save orders to localStorage
 * @param {Array} orders - Array of order objects to save
 */
function saveOrders(orders) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
        return true;
    } catch (error) {
        console.error('Error saving orders to localStorage:', error);
        return false;
    }
}

/**
 * Create a new order
 * @param {Object} orderData - Object containing product name, customer name, and address
 * @returns {Object} The created order object
 */
function createOrder(orderData) {
    const order = {
        id: generateOrderId(),
        productName: orderData.productName,
        customerName: orderData.customerName,
        deliveryAddress: orderData.deliveryAddress,
        status: ORDER_STATUS.PLACED,
        createdAt: new Date().toISOString(),
        notes: '',
        statusHistory: [
            {
                status: ORDER_STATUS.PLACED,
                timestamp: new Date().toISOString()
            }
        ]
    };

    const orders = getOrders();
    orders.unshift(order); // Add to beginning of array
    saveOrders(orders);
    
    return order;
}

/**
 * Get a specific order by ID
 * @param {string} orderId - The order ID to find
 * @returns {Object|null} The order object or null if not found
 */
function getOrderById(orderId) {
    const orders = getOrders();
    return orders.find(order => order.id === orderId) || null;
}

/**
 * Update order status
 * @param {string} orderId - The order ID to update
 * @param {number} newStatus - The new status value (0-3)
 * @returns {boolean} Success status
 */
function updateOrderStatus(orderId, newStatus) {
    const orders = getOrders();
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex === -1) {
        console.error('Order not found:', orderId);
        return false;
    }

    // Don't allow moving backwards or beyond delivered
    if (newStatus < orders[orderIndex].status || newStatus > ORDER_STATUS.DELIVERED) {
        console.warn('Invalid status transition');
        return false;
    }

    // Update order status
    orders[orderIndex].status = newStatus;
    
    // Add to status history if not already present
    const historyExists = orders[orderIndex].statusHistory.some(
        h => h.status === newStatus
    );
    
    if (!historyExists) {
        orders[orderIndex].statusHistory.push({
            status: newStatus,
            timestamp: new Date().toISOString()
        });
    }

    return saveOrders(orders);
}

/**
 * Delete an order
 * @param {string} orderId - The order ID to delete
 * @returns {boolean} Success status
 */
function deleteOrder(orderId) {
    const orders = getOrders();
    const filteredOrders = orders.filter(order => order.id !== orderId);
    
    if (filteredOrders.length === orders.length) {
        console.warn('Order not found:', orderId);
        return false;
    }

    return saveOrders(filteredOrders);
}

/**
 * Get the next status for an order
 * @param {number} currentStatus - Current status value
 * @returns {number|null} Next status value or null if already delivered
 */
function getNextStatus(currentStatus) {
    if (currentStatus >= ORDER_STATUS.DELIVERED) {
        return null;
    }
    return currentStatus + 1;
}

/**
 * Initialize demo data (for first time users)
 * Creates sample orders if no orders exist
 */
function initializeDemoData() {
    const orders = getOrders();
    
    if (orders.length === 0) {
        // Create sample orders with different statuses
        const demoOrders = [
            {
                productName: 'Wireless Bluetooth Headphones',
                customerName: 'John Doe',
                deliveryAddress: '123 Main St, New York, NY 10001'
            },
            {
                productName: 'Smart Watch Series 5',
                customerName: 'Jane Smith',
                deliveryAddress: '456 Oak Ave, Los Angeles, CA 90001'
            },
            {
                productName: 'Laptop Stand',
                customerName: 'Mike Johnson',
                deliveryAddress: '789 Pine Rd, Chicago, IL 60601'
            }
        ];

        // Create orders and set different statuses
        demoOrders.forEach((orderData, index) => {
            const order = createOrder(orderData);
            
            // Set different statuses for variety
            if (index === 0) {
                updateOrderStatus(order.id, ORDER_STATUS.SHIPPED);
            } else if (index === 1) {
                updateOrderStatus(order.id, ORDER_STATUS.PACKED);
            }
            // Third order stays at PLACED
        });
    }
}

/**
 * Search orders by keyword
 * @param {string} keyword - Search keyword
 * @returns {Array} Filtered orders
 */
function searchOrders(keyword) {
    const orders = getOrders();
    const lowerKeyword = keyword.toLowerCase();
    
    return orders.filter(order => 
        order.id.toLowerCase().includes(lowerKeyword) ||
        order.productName.toLowerCase().includes(lowerKeyword) ||
        order.customerName.toLowerCase().includes(lowerKeyword) ||
        order.deliveryAddress.toLowerCase().includes(lowerKeyword)
    );
}

/**
 * Filter orders by status
 * @param {number} status - Status to filter by
 * @returns {Array} Filtered orders
 */
function filterOrdersByStatus(status) {
    const orders = getOrders();
    return orders.filter(order => order.status === status);
}

/**
 * Sort orders by date
 * @param {boolean} ascending - Sort order (true = oldest first)
 * @returns {Array} Sorted orders
 */
function sortOrdersByDate(ascending = false) {
    const orders = getOrders();
    return orders.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return ascending ? dateA - dateB : dateB - dateA;
    });
}

/**
 * Get order statistics
 * @returns {Object} Statistics object
 */
function getOrderStatistics() {
    const orders = getOrders();
    return {
        total: orders.length,
        placed: orders.filter(o => o.status === ORDER_STATUS.PLACED).length,
        packed: orders.filter(o => o.status === ORDER_STATUS.PACKED).length,
        shipped: orders.filter(o => o.status === ORDER_STATUS.SHIPPED).length,
        delivered: orders.filter(o => o.status === ORDER_STATUS.DELIVERED).length
    };
}

/**
 * Export orders to JSON
 * @returns {string} JSON string of all orders
 */
function exportOrdersToJSON() {
    const orders = getOrders();
    return JSON.stringify(orders, null, 2);
}

/**
 * Import orders from JSON
 * @param {string} jsonString - JSON string to import
 * @returns {boolean} Success status
 */
function importOrdersFromJSON(jsonString) {
    try {
        const orders = JSON.parse(jsonString);
        if (Array.isArray(orders)) {
            return saveOrders(orders);
        }
        return false;
    } catch (error) {
        console.error('Error importing orders:', error);
        return false;
    }
}

/**
 * Clear all orders
 * @returns {boolean} Success status
 */
function clearAllOrders() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('Error clearing orders:', error);
        return false;
    }
}

/**
 * Duplicate an order
 * @param {string} orderId - Order ID to duplicate
 * @returns {Object|null} New order or null
 */
function duplicateOrder(orderId) {
    const order = getOrderById(orderId);
    if (!order) return null;
    
    return createOrder({
        productName: order.productName,
        customerName: order.customerName,
        deliveryAddress: order.deliveryAddress
    });
}

/**
 * Get recent orders
 * @param {number} limit - Number of recent orders to get
 * @returns {Array} Recent orders
 */
function getRecentOrders(limit = 5) {
    const orders = sortOrdersByDate(false);
    return orders.slice(0, limit);
}

/**
 * Update order notes
 * @param {string} orderId - Order ID
 * @param {string} notes - Notes text
 * @returns {boolean} Success status
 */
function updateOrderNotes(orderId, notes) {
    const orders = getOrders();
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex === -1) {
        return false;
    }
    
    orders[orderIndex].notes = notes;
    return saveOrders(orders);
}
