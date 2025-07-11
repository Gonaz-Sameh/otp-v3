const whatsappClients = require('./whatsappClients');
const Otp = require('../../models/Otp');
const { sendMessageLikeHuman, rateLimiter } = require('./whatsappHumanBehavior');

// Helper function to get WhatsApp messages sent today for a number
async function getWhatsappMessagesSentToday(number) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    return await Otp.countDocuments({
        'channel_data.number': number,
        channel_name: 'whatsapp',
        created_at: { $gte: startOfDay }
    });
}

// Helper function to add random delay to mimic human behavior
function getRandomDelay(minMs = 1000, maxMs = 3000) {
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

// Helper function to simulate typing delay based on message length
function getTypingDelay(messageLength) {
    // Average human typing speed: 40 words per minute
    // Average word length: 5 characters
    const wordsPerMinute = 40;
    const avgWordLength = 5;
    const words = Math.ceil(messageLength / avgWordLength);
    const typingTimeMs = (words / wordsPerMinute) * 60 * 1000;
    
    // Add some randomness to make it more human-like
    const randomFactor = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
    const delay = Math.floor(typingTimeMs * randomFactor);
    return Math.min(delay, 10000); // Cap at 10 seconds (10000 ms)
}

// Helper function to add message variations to avoid detection
function addMessageVariations(message, organizationName) {
    const variations = [
        // Add subtle variations to the message
        message,
        message.replace('Your verification code is:', 'Here\'s your verification code:'),
        message.replace('Your verification code is:', 'Your code is:'),
        message.replace('This code expires in 90 seconds', 'Valid for 90 seconds'),
        message.replace('This code expires in 90 seconds', 'Expires in 90 seconds'),
        message.replace('Keep this code private', 'Please keep this code private'),
        message.replace('Keep this code private', 'Don\'t share this code'),
        message.replace('We\'ll never ask for it via phone or email', 'We won\'t ask for it via phone or email'),
        message.replace('We\'ll never ask for it via phone or email', 'We never ask for codes via phone or email'),
        message.replace('If you didn\'t request this, please ignore', 'If you didn\'t request this code, please ignore'),
        message.replace('Thank you for using', 'Thanks for using'),
        message.replace('Thank you for using', 'Thank you for choosing')
    ];
    
    // Randomly select a variation
    return variations[Math.floor(Math.random() * variations.length)];
}

// Main function to send WhatsApp message like a human
async function sendWhatsappLikeHuman({ 
    number, 
    message, 
    organizationId, 
    maxPerDay = 197, 
    minDelayMs = 2000, 
    maxDelayMs = 6000 
}) {
    try {
        // 1. Check daily limit
        const sentToday = await getWhatsappMessagesSentToday(number);
        if (sentToday >= maxPerDay) {
            throw new Error(`Daily WhatsApp limit of ${maxPerDay} reached for this number.`);
        }

        // 2. Get WhatsApp client
        const client = whatsappClients.get(organizationId.toString());
        if (!client) {
            throw new Error('WhatsApp client not available. Please re-authenticate.');
        }

        // 3. Add message variations to avoid detection
        const variedMessage = addMessageVariations(message, 'Our Service');

        // 4. Random delay before sending (mimic human behavior)
    /*    const preDelay = getRandomDelay(minDelayMs, maxDelayMs);
        console.log(`sendWhatsappLikeHuman - Waiting ${preDelay}ms before sending...`);
        await new Promise(resolve => setTimeout(resolve, preDelay));
*/
        // 5. Check rate limits
        const rateLimitCheck = rateLimiter.canSendMessage(number);
        if (!rateLimitCheck.canSend) {
            throw new Error(`Rate limit exceeded: ${rateLimitCheck.reason}`);
        }

        // 6. Send message with enhanced human-like behavior
        console.log(`sendWhatsappLikeHuman - Sending message to ${number} with human-like behavior...`);
        const chatId = `2${number}@c.us`;
        const result = await sendMessageLikeHuman(client, chatId, variedMessage, {
            enableTyping: true, // Disable typing indicator since it's not supported
            enableReadReceipt: false,
            enableFormatting: true,
            enableDelays: true
        });

        // 7. Record in rate limiter
        rateLimiter.recordMessage(number);

        console.log(`sendWhatsappLikeHuman - Message sent successfully to ${number}`);
        
        return { 
            sent: true, 
            number, 
            message: variedMessage, 
           // preDelayMs: preDelay,
            sentCountToday: sentToday + 1,
            
        };

    } catch (error) {
        console.error('sendWhatsappLikeHuman - Error:', error.message);
        throw error;
    }
}

// Queued version for better rate limiting
function sendWhatsappLikeHumanQueued(params) {
    return new Promise((resolve, reject) => {
        // Simple queue implementation - can be enhanced with a proper job queue
        setTimeout(async () => {
            try {
                const result = await sendWhatsappLikeHuman(params);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }, getRandomDelay(100, 500)); // Small initial delay
    });
}

module.exports = { 
    sendWhatsappLikeHuman, 
    sendWhatsappLikeHumanQueued,
    getWhatsappMessagesSentToday,
    getRandomDelay,
    getTypingDelay,
    addMessageVariations
}; 