/**
 * APP.JS
 * Main application entry point for the order history page
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the order history page
    initOrderHistoryPage();
    
    // Optional: Initialize with demo data on first visit
    // Uncomment the line below to create sample orders automatically
    // initializeDemoData();
});

// Listen for storage events (when localStorage is updated in another tab)
window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
        renderOrders();
    }
});
