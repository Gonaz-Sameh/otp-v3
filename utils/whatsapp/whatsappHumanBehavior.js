const whatsappClients = require('./whatsappClients');

// Human-like behavior utilities for WhatsApp messaging

// Simulate natural human typing patterns
function simulateHumanTyping(client, chatId, messageLength) {
    return new Promise(async (resolve) => {
        try {
            if (typeof client.sendPresenceUpdate === 'function') {
                await client.sendPresenceUpdate('composing', chatId);
            }

            // Use a fixed random delay (e.g., 2–5 seconds)
            const minTypingTime = 2000; // 2 seconds
            const maxTypingTime = 5000; // 5 seconds
            const typingTime = Math.floor(Math.random() * (maxTypingTime - minTypingTime + 1)) + minTypingTime;

            await new Promise(resolve => setTimeout(resolve, typingTime));
            console.log(`simulateHumanTyping - Fixed typing time: ${typingTime}ms`);

            if (typeof client.sendPresenceUpdate === 'function') {
                await client.sendPresenceUpdate('paused', chatId);
            }

            resolve();
        } catch (error) {
            console.log('simulateHumanTyping - Error:', error.message);
            resolve();
        }
    });
}

// Add natural delays between messages
function getNaturalDelay() {
    // Different types of delays humans naturally have
    const delayTypes = [
        { min: 300, max: 1200, weight: 0.4 },   // Quick response
        { min: 1200, max: 3000, weight: 0.3 },   // Normal response
        { min: 3000, max: 5000, weight: 0.2 },  // Slow response
        { min: 5000, max: 6500, weight: 0.1 }  // Very slow response
    ];
    
    // Select delay type based on weights
    const random = Math.random();
    let cumulativeWeight = 0;
    let selectedType;
    
    for (const type of delayTypes) {
        cumulativeWeight += type.weight;
        if (random <= cumulativeWeight) {
            selectedType = type;
            break;
        }
    }
    
    // Generate delay within selected range
    return Math.floor(Math.random() * (selectedType.max - selectedType.min + 1)) + selectedType.min;
}

// Simulate message read receipts (optional)
function simulateReadReceipt(client, chatId) {
    return new Promise(async (resolve) => {
        try {
            // Wait a bit before marking as read (like humans do)
            const readDelay = 1000 + Math.random() * 3000;
            await new Promise(resolve => setTimeout(resolve, readDelay));
            
            // Mark as read (if supported by the library)
            // Note: This might not be available in all WhatsApp Web.js versions
            try {
                await client.sendPresenceUpdate('read', chatId);
            } catch (error) {
                // Ignore if not supported
            }
            
            resolve();
        } catch (error) {
            console.log('simulateReadReceipt - Error:', error.message);
            resolve();
        }
    });
}

// Add message formatting variations
function addMessageFormatting(message) {
    const formattingVariations = [
        // No formatting
        message,
        
        // Add some emojis occasionally
        message.replace('Security Reminder:', '🔒 Security Reminder:'),
        message.replace('Security Note:', '🔒 Security Note:'),
        message.replace('Important:', '⚠️ Important:'),
        message.replace('Security:', '🔒 Security:'),
        
        // Add line breaks for readability
        message.replace('• Keep this code private', '• Keep this code private\n'),
        message.replace('• We\'ll never ask for it', '• We\'ll never ask for it\n'),
        message.replace('• If you didn\'t request this', '• If you didn\'t request this\n'),
        
        // Add subtle text variations
        message.replace('Your verification code is:', 'Your verification code is:'),
        message.replace('Here\'s your verification code:', 'Here\'s your verification code:'),
        message.replace('Your code is:', 'Your code is:'),
        message.replace('Verification code:', 'Verification code:')
    ];
    
    // Randomly select a formatting variation
    return formattingVariations[Math.floor(Math.random() * formattingVariations.length)];
}

// Simulate human-like message sending with all behaviors
async function sendMessageLikeHuman(client, chatId, message, options = {}) {
    const {
        enableTyping = true,
        enableReadReceipt = false,
        enableFormatting = true,
        enableDelays = true
    } = options;
    
    try {
        // 1. Pre-send delay (like humans thinking before sending)
        if (enableDelays) {
            const preDelay = getNaturalDelay();
            console.log(`sendMessageLikeHuman - Pre-send delay: ${preDelay}ms`);
            await new Promise(resolve => setTimeout(resolve, preDelay));
        }
        
        // 2. Format message if enabled
        const formattedMessage = enableFormatting ? addMessageFormatting(message) : message;
        
        // 3. Simulate typing if enabled
        if (enableTyping) {
            try {
                await simulateHumanTyping(client, chatId, formattedMessage.length);
               
            } catch (error) {
                console.log('sendMessageLikeHuman - Typing simulation failed, continuing without it:', error.message);
            }
        }
        
        // 4. Send the message
          await client.sendMessage(chatId, formattedMessage);
        
        // 5. Simulate read receipt if enabled
        if (enableReadReceipt) {
            await simulateReadReceipt(client, chatId);
        }
        
        // 6. Post-send delay (like humans taking time after sending)
        if (enableDelays) {
          
            const postDelay = 500 + Math.random() * 1500;
            console.log("Debug - postDelay : ",postDelay);
            await new Promise(resolve => setTimeout(resolve, postDelay));
        }
        console.log("Debug - END : ",);
    } catch (error) {
        console.error('sendMessageLikeHuman - Error:', error.message);
        throw error;
    }
}

// Rate limiting utility to prevent spam
class RateLimiter {
    constructor() {
        this.messageHistory = new Map(); // number -> array of timestamps
        this.maxMessagesPerHour = 10;
        this.maxMessagesPerDay = 50;
    }
    
    canSendMessage(number) {
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        
        if (!this.messageHistory.has(number)) {
            this.messageHistory.set(number, []);
        }
        
        const history = this.messageHistory.get(number);
        
        // Clean old entries
        const recentHistory = history.filter(timestamp => timestamp > oneDayAgo);
        this.messageHistory.set(number, recentHistory);
        
        // Check hourly limit
        const hourlyMessages = recentHistory.filter(timestamp => timestamp > oneHourAgo).length;
        if (hourlyMessages >= this.maxMessagesPerHour) {
            return { canSend: false, reason: 'Hourly limit exceeded' };
        }
        
        // Check daily limit
        if (recentHistory.length >= this.maxMessagesPerDay) {
            return { canSend: false, reason: 'Daily limit exceeded' };
        }
        
        return { canSend: true };
    }
    
    recordMessage(number) {
        if (!this.messageHistory.has(number)) {
            this.messageHistory.set(number, []);
        }
        
        this.messageHistory.get(number).push(Date.now());
    }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

module.exports = {
    simulateHumanTyping,
    getNaturalDelay,
    simulateReadReceipt,
    addMessageFormatting,
    sendMessageLikeHuman,
    rateLimiter
}; 