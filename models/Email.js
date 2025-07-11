const mongoose = require('mongoose');
const crypto = require('crypto');

const EmailSchema = new mongoose.Schema({
    email_host: { type: String, required: [true, 'email_host required']  },
    email_port: { type: Number, required: [true, 'email_port required'] },
    email_user: { 
        type: String, 
        required: [true, 'email_user required'],
        unique: [true, 'email_user is unique ']
    },
    email_password: { type: String, required: [true, 'email_password required'] },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    }
});


const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
const IV_LENGTH = 16; // For AES, this is always 16

// Encrypt function
function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

// Decrypt function
function decrypt(text) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = textParts.join(':');
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// Pre-save middleware to encrypt password
EmailSchema.pre('save', async function (next) {
    if (!this.isModified('email_password')) return next();
    // Encrypt email password
    this.email_password = encrypt(this.email_password);
    next();
});

// Instance method to decrypt password
EmailSchema.methods.decryptPassword = function() {
    return decrypt(this.email_password);
};

module.exports = mongoose.model('Email', EmailSchema); 