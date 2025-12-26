/**
 * CHATBOT.JS
 * AI-powered chatbot assistant for order tracking
 */

let isChatbotOpen = false;
let chatHistory = [];

/**
 * Initialize chatbot
 */
function initChatbot() {
    const chatbotToggle = document.getElementById('chatbotToggle');
    const minimizeBtn = document.getElementById('minimizeChatbot');
    const chatbotSend = document.getElementById('chatbotSend');
    const chatbotInput = document.getElementById('chatbotInput');
    
    // Toggle chatbot
    chatbotToggle.addEventListener('click', () => {
        toggleChatbot();
    });
    
    // Minimize chatbot
    minimizeBtn.addEventListener('click', () => {
        toggleChatbot();
    });
    
    // Send message
    chatbotSend.addEventListener('click', () => {
        sendMessage();
    });
    
    // Send on Enter key
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Setup quick replies
    setupQuickReplies();
}

/**
 * Toggle chatbot visibility
 */
function toggleChatbot() {
    const chatbotContainer = document.getElementById('chatbotContainer');
    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatBadge = document.getElementById('chatBadge');
    
    isChatbotOpen = !isChatbotOpen;
    
    if (isChatbotOpen) {
        chatbotContainer.classList.add('active');
        chatbotToggle.classList.add('active');
        if (chatBadge) chatBadge.style.display = 'none';
    } else {
        chatbotContainer.classList.remove('active');
        chatbotToggle.classList.remove('active');
    }
}

/**
 * Send user message
 */
function sendMessage() {
    const input = document.getElementById('chatbotInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addMessage(message, 'user');
    
    // Clear input
    input.value = '';
    
    // Process message and get response
    setTimeout(() => {
        const response = getBotResponse(message);
        addMessage(response, 'bot');
    }, 500);
}

/**
 * Add message to chat
 */
function addMessage(text, sender) {
    const messagesContainer = document.getElementById('chatbotMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${text}</p>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Store in history
    chatHistory.push({ sender, text, timestamp: new Date() });
}

/**
 * Get bot response based on user message
 */
function getBotResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check order status
    if (lowerMessage.includes('status') || lowerMessage.includes('track') || lowerMessage.includes('where')) {
        const orders = getOrders();
        if (orders.length === 0) {
            return "You don't have any orders yet. Would you like to create one?";
        }
        const recentOrder = orders[0];
        return `Your most recent order ${recentOrder.id} (${recentOrder.productName}) is currently <strong>${STATUS_LABELS[recentOrder.status]}</strong>. Click the Track Order button to see full details.`;
    }
    
    // Create order
    if (lowerMessage.includes('create') || lowerMessage.includes('new order') || lowerMessage.includes('place order')) {
        return "To create a new order, click the 'Create New Order' button at the top of the page and fill in the product details.";
    }
    
    // Order count
    if (lowerMessage.includes('how many') || lowerMessage.includes('total')) {
        const stats = getOrderStatistics();
        return `You have <strong>${stats.total}</strong> total orders: ${stats.placed} placed, ${stats.packed} packed, ${stats.shipped} shipped, and ${stats.delivered} delivered.`;
    }
    
    // Delete orders
    if (lowerMessage.includes('delete') || lowerMessage.includes('remove')) {
        return "To delete an order, click the Delete button on the order card. To delete all orders, use the 'Clear All' button in the filters section.";
    }
    
    // Export
    if (lowerMessage.includes('export') || lowerMessage.includes('download')) {
        return "You can export all your orders as a JSON file using the 'Export' button in the filters section. This is useful for backup or sharing data.";
    }
    
    // Search
    if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
        return "Use the search box at the top to find orders by order ID, product name, customer name, or address. You can also filter by status!";
    }
    
    // Delivery time
    if (lowerMessage.includes('when') || lowerMessage.includes('delivery') || lowerMessage.includes('arrive')) {
        return "Delivery times vary by order status:<br>• <strong>Placed:</strong> Processing (1-2 days)<br>• <strong>Packed:</strong> Ready to ship (1 day)<br>• <strong>Shipped:</strong> In transit (2-5 days)<br>• <strong>Delivered:</strong> Completed!";
    }
    
    // Help
    if (lowerMessage.includes('help') || lowerMessage.includes('how') || lowerMessage.includes('what')) {
        return "I can help you with:<br>• Checking order status<br>• Creating new orders<br>• Tracking deliveries<br>• Searching orders<br>• Exporting data<br>• General questions<br><br>Just ask me anything!";
    }
    
    // Greeting
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return "Hello! 👋 How can I assist you with your orders today?";
    }
    
    // Thank you
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
        return "You're welcome! Happy to help! 😊 Let me know if you need anything else.";
    }
    
    // Contact
    if (lowerMessage.includes('contact') || lowerMessage.includes('support') || lowerMessage.includes('email')) {
        return "For customer support, you can reach us at:<br>📧 support@ordertrack.com<br>📞 1-800-ORDER-01<br>⏰ Available 24/7";
    }
    
    // Default response
    return "I'm not sure I understand. You can ask me about:<br>• Order status and tracking<br>• Creating new orders<br>• Delivery information<br>• How to use features<br>• Export and search options";
}

/**
 * Setup quick reply buttons
 */
function setupQuickReplies() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-reply')) {
            const action = e.target.getAttribute('data-action');
            handleQuickReply(action);
        }
    });
}

/**
 * Handle quick reply actions
 */
function handleQuickReply(action) {
    let response = '';
    
    switch(action) {
        case 'orderStatus':
            const orders = getOrders();
            if (orders.length === 0) {
                response = "You don't have any orders yet. Click 'Create New Order' to get started!";
            } else {
                const stats = getOrderStatistics();
                response = `You have ${stats.total} orders:<br>• ${stats.placed} Order Placed<br>• ${stats.packed} Packed<br>• ${stats.shipped} Shipped<br>• ${stats.delivered} Delivered`;
            }
            break;
            
        case 'createOrder':
            response = "To create a new order:<br>1. Click 'Create New Order' button<br>2. Enter product name<br>3. Add customer details<br>4. Enter delivery address<br>5. Click 'Create Order'<br><br>Your order will be created instantly!";
            break;
            
        case 'help':
            response = "📚 <strong>Quick Help Guide:</strong><br><br><strong>Search:</strong> Use the search box to find orders<br><strong>Filter:</strong> Filter by order status<br><strong>Sort:</strong> Sort by newest/oldest<br><strong>Track:</strong> Click 'Track Order' to see progress<br><strong>Duplicate:</strong> Copy existing orders<br><strong>Export:</strong> Download orders as JSON<br><br>Need more help? Just ask!";
            break;
            
        default:
            response = "How can I assist you?";
    }
    
    addMessage(response, 'bot');
}

/**
 * Add typing indicator
 */
function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatbotMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-content">
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Initialize chatbot when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    initChatbot();
});
