/**
 * UI.JS
 * Handles UI rendering and updates for the order history page
 */

let currentSearchTerm = '';
let currentStatusFilter = 'all';
let currentSortOrder = 'newest';

/**
 * Render all orders in the order history
 */
function renderOrders() {
    const ordersContainer = document.getElementById('ordersContainer');
    const emptyState = document.getElementById('emptyState');
    let orders = getOrders();

    // Apply search filter
    if (currentSearchTerm) {
        orders = searchOrders(currentSearchTerm);
    }

    // Apply status filter
    if (currentStatusFilter !== 'all') {
        orders = orders.filter(o => o.status === parseInt(currentStatusFilter));
    }

    // Apply sort
    orders = orders.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return currentSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // Update statistics
    updateStatistics();

    // Show empty state if no orders
    if (orders.length === 0) {
        ordersContainer.style.display = 'none';
        emptyState.classList.add('active');
        return;
    }

    // Hide empty state and show orders
    ordersContainer.style.display = 'grid';
    emptyState.classList.remove('active');

    // Clear existing orders
    ordersContainer.innerHTML = '';

    // Render each order
    orders.forEach(order => {
        const orderCard = createOrderCard(order);
        ordersContainer.appendChild(orderCard);
    });
}

/**
 * Update statistics display
 */
function updateStatistics() {
    const stats = getOrderStatistics();
    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statPlaced').textContent = stats.placed;
    document.getElementById('statPacked').textContent = stats.packed;
    document.getElementById('statShipped').textContent = stats.shipped;
    document.getElementById('statDelivered').textContent = stats.delivered;
}

/**
 * Create an order card element
 * @param {Object} order - Order object
 * @returns {HTMLElement} Order card element
 */
function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';
    
    const statusClass = STATUS_CLASSES[order.status];
    const statusLabel = STATUS_LABELS[order.status];
    
    card.innerHTML = `
        <div class="order-card-header">
            <div>
                <h3 class="order-id">${order.id}</h3>
                <p class="order-date">Placed: ${formatDateShort(order.createdAt)}</p>
            </div>
            <span class="status-badge ${statusClass}">${statusLabel}</span>
        </div>
        <div class="order-info">
            <p><strong>Product:</strong> ${order.productName}</p>
            <p><strong>Customer:</strong> ${order.customerName}</p>
            <p><strong>Address:</strong> ${truncateText(order.deliveryAddress, 50)}</p>
        </div>
        <div class="order-card-footer">
            <button class="btn btn-primary btn-track" data-order-id="${order.id}">
                <span class="btn-icon">👁️</span>
                Track
            </button>
            <button class="btn btn-secondary btn-duplicate" data-order-id="${order.id}">
                <span class="btn-icon">📋</span>
                Duplicate
            </button>
            <button class="btn btn-delete" data-order-id="${order.id}">
                <span class="btn-icon">🗑️</span>
                Delete
            </button>
        </div>
    `;

    // Add event listeners
    const trackBtn = card.querySelector('.btn-track');
    const duplicateBtn = card.querySelector('.btn-duplicate');
    const deleteBtn = card.querySelector('.btn-delete');

    trackBtn.addEventListener('click', () => {
        window.location.href = `track.html?orderId=${order.id}`;
    });

    duplicateBtn.addEventListener('click', () => {
        handleDuplicateOrder(order.id);
    });

    deleteBtn.addEventListener('click', () => {
        handleDeleteOrder(order.id);
    });

    return card;
}

/**
 * Handle order deletion with confirmation
 * @param {string} orderId - Order ID to delete
 */
function handleDeleteOrder(orderId) {
    const confirmed = confirm('Are you sure you want to delete this order?');
    
    if (confirmed) {
        const success = deleteOrder(orderId);
        
        if (success) {
            renderOrders();
            showNotification('Order deleted successfully', 'success');
        } else {
            showNotification('Failed to delete order', 'error');
        }
    }
}

/**
 * Handle order duplication
 * @param {string} orderId - Order ID to duplicate
 */
function handleDuplicateOrder(orderId) {
    const newOrder = duplicateOrder(orderId);
    
    if (newOrder) {
        renderOrders();
        showNotification('Order duplicated successfully!', 'success');
    } else {
        showNotification('Failed to duplicate order', 'error');
    }
}

/**
 * Setup search functionality
 */
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', debounce((e) => {
        currentSearchTerm = e.target.value.trim();
        renderOrders();
    }, 300));
}

/**
 * Setup filters
 */
function setupFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const sortFilter = document.getElementById('sortFilter');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const exportBtn = document.getElementById('exportBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    
    statusFilter.addEventListener('change', (e) => {
        currentStatusFilter = e.target.value;
        renderOrders();
    });
    
    sortFilter.addEventListener('change', (e) => {
        currentSortOrder = e.target.value;
        renderOrders();
    });
    
    clearAllBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete ALL orders? This cannot be undone!')) {
            const success = clearAllOrders();
            if (success) {
                renderOrders();
                showNotification('All orders cleared', 'success');
            }
        }
    });
    
    exportBtn.addEventListener('click', () => {
        const json = exportOrdersToJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Orders exported successfully', 'success');
    });
    
    refreshBtn.addEventListener('click', () => {
        renderOrders();
        showNotification('Orders refreshed', 'success');
    });
}

/**
 * Handle modal open/close
 */
function setupModal() {
    const modal = document.getElementById('createOrderModal');
    const createOrderBtn = document.getElementById('createOrderBtn');
    const createFirstOrderBtn = document.getElementById('createFirstOrderBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    // Open modal
    const openModal = () => {
        modal.classList.add('active');
    };

    // Close modal
    const closeModal = () => {
        modal.classList.remove('active');
        document.getElementById('createOrderForm').reset();
    };

    // Event listeners
    createOrderBtn.addEventListener('click', openModal);
    createFirstOrderBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

/**
 * Handle order creation form submission
 */
function setupOrderForm() {
    const form = document.getElementById('createOrderForm');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = {
            productName: document.getElementById('productName').value.trim(),
            customerName: document.getElementById('customerName').value.trim(),
            deliveryAddress: document.getElementById('deliveryAddress').value.trim()
        };

        // Validate form data
        if (!formData.productName || !formData.customerName || !formData.deliveryAddress) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        // Create order
        const order = createOrder(formData);
        
        if (order) {
            // Close modal and reset form
            document.getElementById('createOrderModal').classList.remove('active');
            form.reset();
            
            // Refresh orders list
            renderOrders();
            
            // Show success message
            showNotification('Order created successfully!', 'success');
        } else {
            showNotification('Failed to create order', 'error');
        }
    });
}

/**
 * Initialize the order history page
 */
function initOrderHistoryPage() {
    // Initialize demo data if needed (can be removed in production)
    // initializeDemoData();
    
    // Setup modal functionality
    setupModal();
    
    // Setup order form
    setupOrderForm();
    
    // Setup search
    setupSearch();
    
    // Setup filters
    setupFilters();
    
    // Render orders
    renderOrders();
}
