function getOtpWhatsappMessage(otpValue, organizationName = 'Our Service') {
    // Create multiple message variations to avoid detection
    const messageVariations = [
        // Variation 1: Direct and professional
        `*${organizationName}*\n\n` +
        `Your verification code is:\n` +
        `*${otpValue}*\n\n` +
        `This code expires in 90 seconds\n\n` +
        `*Security Reminder:*\n` +
        `• Keep this code private\n` +
        `• We'll never ask for it via phone or email\n` +
        `• If you didn't request this, please ignore\n\n` +
        `Thank you for using ${organizationName}!`,

        // Variation 2: More conversational
        `*${organizationName}*\n\n` +
        `Here's your verification code:\n` +
        `*${otpValue}*\n\n` +
        `Valid for 90 seconds\n\n` +
        `*Security Note:*\n` +
        `• Please keep this code private\n` +
        `• We won't ask for it via phone or email\n` +
        `• If you didn't request this code, please ignore\n\n` +
        `Thanks for using ${organizationName}!`,

        // Variation 3: Friendly tone
        `*${organizationName}*\n\n` +
        `Your code is:\n` +
        `*${otpValue}*\n\n` +
        `Expires in 90 seconds\n\n` +
        `*Important:*\n` +
        `• Don't share this code\n` +
        `• We never ask for codes via phone or email\n` +
        `• If you didn't request this, please ignore\n\n` +
        `Thank you for choosing ${organizationName}!`,

        // Variation 4: Brief and clear
        `*${organizationName}*\n\n` +
        `Verification code:\n` +
        `*${otpValue}*\n\n` +
        `90 seconds to use\n\n` +
        `*Security:*\n` +
        `• Keep private\n` +
        `• We won't ask for it\n` +
        `• Ignore if not requested\n\n` +
        `Thank you!`
    ];

    // Randomly select a variation
    const selectedVariation = messageVariations[Math.floor(Math.random() * messageVariations.length)];
    
    return selectedVariation;
}

module.exports = { getOtpWhatsappMessage }; 