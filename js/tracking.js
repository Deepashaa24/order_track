/**
 * TRACKING.JS
 * Handles the order tracking page logic and UI updates
 */

// Global variables for tracking page
let currentOrder = null;
let autoProgressInterval = null;
let isAutoProgressing = false;

/**
 * Initialize the tracking page
 */
function initTrackingPage() {
    // Get order ID from URL
    const orderId = getUrlParameter('orderId');
    
    if (!orderId) {
        showOrderNotFound();
        return;
    }

    // Load order data
    currentOrder = getOrderById(orderId);
    
    if (!currentOrder) {
        showOrderNotFound();
        return;
    }

    // Render order details and tracking
    renderOrderDetails();
    renderProgressTracker();
    setupTrackingControls();
    setupAdditionalFeatures();
    
    // Update UI based on order status
    updateActionButtons();
    
    // Load saved notes
    loadDeliveryNotes();
}

/**
 * Show order not found message
 */
function showOrderNotFound() {
    document.getElementById('orderDetailsCard').style.display = 'none';
    document.getElementById('progressTracker').style.display = 'none';
    document.getElementById('actionButtons').style.display = 'none';
    document.getElementById('notFound').style.display = 'block';
}

/**
 * Render order details
 */
function renderOrderDetails() {
    document.getElementById('orderIdDisplay').textContent = currentOrder.id;
    document.getElementById('orderDateDisplay').textContent = `Placed on: ${formatDateShort(currentOrder.createdAt)}`;
    document.getElementById('productNameDisplay').textContent = currentOrder.productName;
    document.getElementById('customerNameDisplay').textContent = currentOrder.customerName;
    document.getElementById('deliveryAddressDisplay').textContent = currentOrder.deliveryAddress;
    
    // Update status badge
    const statusBadge = document.getElementById('statusBadge');
    const statusClass = STATUS_CLASSES[currentOrder.status];
    const statusLabel = STATUS_LABELS[currentOrder.status];
    statusBadge.textContent = statusLabel;
    statusBadge.className = `status-badge ${statusClass}`;
}

/**
 * Render progress tracker with steps
 */
function renderProgressTracker() {
    const progressBar = document.getElementById('progressBar');
    const steps = document.querySelectorAll('.step');
    
    // Calculate and set progress bar width
    const progress = calculateProgress(currentOrder.status);
    progressBar.style.width = `${progress}%`;
    
    // Update step states
    steps.forEach((step, index) => {
        const stepElement = step;
        const stepDateElement = document.getElementById(`step${index}Date`);
        
        // Remove all state classes
        stepElement.classList.remove('active', 'completed');
        
        if (index < currentOrder.status) {
            // Completed step
            stepElement.classList.add('completed');
            
            // Find the date for this status in history
            const statusHistory = currentOrder.statusHistory.find(h => h.status === index);
            if (statusHistory) {
                stepDateElement.textContent = formatDate(statusHistory.timestamp);
            }
        } else if (index === currentOrder.status) {
            // Current active step
            stepElement.classList.add('active');
            
            // Find the date for this status in history
            const statusHistory = currentOrder.statusHistory.find(h => h.status === index);
            if (statusHistory) {
                stepDateElement.textContent = formatDate(statusHistory.timestamp);
            }
        } else {
            // Future step
            stepDateElement.textContent = 'Pending';
        }
    });
}

/**
 * Setup tracking controls (buttons)
 */
function setupTrackingControls() {
    const nextStageBtn = document.getElementById('nextStageBtn');
    const autoProgressBtn = document.getElementById('autoProgressBtn');
    
    // Next stage button
    nextStageBtn.addEventListener('click', handleNextStage);
    
    // Auto progress button
    autoProgressBtn.addEventListener('click', handleAutoProgress);
}

/**
 * Handle moving to next stage manually
 */
function handleNextStage() {
    const nextStatus = getNextStatus(currentOrder.status);
    
    if (nextStatus === null) {
        showNotification('Order is already delivered!', 'info');
        return;
    }

    // Update order status
    const success = updateOrderStatus(currentOrder.id, nextStatus);
    
    if (success) {
        // Reload current order data
        currentOrder = getOrderById(currentOrder.id);
        
        // Update UI with smooth transition
        renderOrderDetails();
        renderProgressTracker();
        updateActionButtons();
        
        // Show notification
        showNotification(`Order moved to: ${STATUS_LABELS[nextStatus]}`, 'success');
    } else {
        showNotification('Failed to update order status', 'error');
    }
}

/**
 * Handle auto progress toggle
 */
async function handleAutoProgress() {
    const autoProgressBtn = document.getElementById('autoProgressBtn');
    
    if (isAutoProgressing) {
        // Stop auto progress
        stopAutoProgress();
        autoProgressBtn.innerHTML = '<span class="btn-icon">⏯️</span> Auto Progress';
    } else {
        // Start auto progress
        if (currentOrder.status >= ORDER_STATUS.DELIVERED) {
            showNotification('Order is already delivered!', 'info');
            return;
        }
        
        isAutoProgressing = true;
        autoProgressBtn.innerHTML = '<span class="btn-icon">⏸️</span> Stop Auto Progress';
        autoProgressBtn.classList.add('active');
        
        // Disable next stage button during auto progress
        document.getElementById('nextStageBtn').disabled = true;
        
        // Start auto progression
        await autoProgressOrder();
    }
}

/**
 * Auto progress order through stages
 */
async function autoProgressOrder() {
    while (isAutoProgressing && currentOrder.status < ORDER_STATUS.DELIVERED) {
        // Wait for 3 seconds between each stage
        await sleep(3000);
        
        if (!isAutoProgressing) break;
        
        const nextStatus = getNextStatus(currentOrder.status);
        
        if (nextStatus !== null) {
            const success = updateOrderStatus(currentOrder.id, nextStatus);
            
            if (success) {
                currentOrder = getOrderById(currentOrder.id);
                renderOrderDetails();
                renderProgressTracker();
                updateActionButtons();
                
                // Show brief notification
                console.log(`Auto-progressed to: ${STATUS_LABELS[nextStatus]}`);
            }
        }
    }
    
    // Stop auto progress when complete
    stopAutoProgress();
    
    if (currentOrder.status >= ORDER_STATUS.DELIVERED) {
        showNotification('Order has been delivered!', 'success');
    }
}

/**
 * Stop auto progress
 */
function stopAutoProgress() {
    isAutoProgressing = false;
    
    const autoProgressBtn = document.getElementById('autoProgressBtn');
    autoProgressBtn.innerHTML = '<span class="btn-icon">⏯️</span> Auto Progress';
    autoProgressBtn.classList.remove('active');
    
    // Re-enable next stage button
    document.getElementById('nextStageBtn').disabled = false;
    
    updateActionButtons();
}

/**
 * Update action buttons based on order status
 */
function updateActionButtons() {
    const nextStageBtn = document.getElementById('nextStageBtn');
    const autoProgressBtn = document.getElementById('autoProgressBtn');
    
    // Disable buttons if order is delivered
    if (currentOrder.status >= ORDER_STATUS.DELIVERED) {
        nextStageBtn.disabled = true;
        autoProgressBtn.disabled = true;
        nextStageBtn.innerHTML = '<span class="btn-icon">✅</span> Order Delivered';
    } else {
        nextStageBtn.disabled = false;
        autoProgressBtn.disabled = false;
        
        const nextStatus = getNextStatus(currentOrder.status);
        if (nextStatus !== null) {
            nextStageBtn.innerHTML = `<span class="btn-icon">→</span> Move to ${STATUS_LABELS[nextStatus]}`;
        }
    }
}

/**
 * Setup additional features (print, notes)
 */
function setupAdditionalFeatures() {
    const printBtn = document.getElementById('printBtn');
    const saveNotesBtn = document.getElementById('saveNotesBtn');
    
    printBtn.addEventListener('click', () => {
        window.print();
    });
    
    saveNotesBtn.addEventListener('click', handleSaveNotes);
}

/**
 * Load delivery notes
 */
function loadDeliveryNotes() {
    const notesTextarea = document.getElementById('deliveryNotes');
    if (currentOrder.notes) {
        notesTextarea.value = currentOrder.notes;
    }
}

/**
 * Handle save notes
 */
function handleSaveNotes() {
    const notesTextarea = document.getElementById('deliveryNotes');
    const notes = notesTextarea.value.trim();
    
    const success = updateOrderNotes(currentOrder.id, notes);
    
    if (success) {
        currentOrder.notes = notes;
        showNotification('Notes saved successfully', 'success');
    } else {
        showNotification('Failed to save notes', 'error');
    }
}

// Initialize tracking page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initTrackingPage();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopAutoProgress();
});

// Listen for storage events (when localStorage is updated in another tab)
window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && currentOrder) {
        const updatedOrder = getOrderById(currentOrder.id);
        if (updatedOrder) {
            currentOrder = updatedOrder;
            renderOrderDetails();
            renderProgressTracker();
            updateActionButtons();
        }
    }
});
