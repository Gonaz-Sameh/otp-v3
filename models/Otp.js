const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: [true, 'Organization is required']
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    expire_at: {
        type: Date,
        required: true,
        default: function() {
            // Set expiration to 90 seconds from creation
            return new Date(Date.now() + 90 * 1000);
        }
    },
    value: {
        type: String,
        required: [true, 'OTP value is required'],
        minlength: [6, 'OTP must be at least 6 characters'],
        maxlength: [6, 'OTP must be exactly 6 characters']
    },
    is_entered_successfully: {
        type: Boolean,
        default: false
    },
    num_failed_attempts: {
        type: Number,
        default: 0,
        min: [0, 'Failed attempts cannot be negative'],
        max: [4, 'Maximum 4 failed attempts allowed']
    },
    channel_name: {
        type: String,
        required: [true, 'Channel name is required'],
        enum: ['whatsapp', 'email', 'sms'], // Add more channels as needed
        lowercase: true
    },
    message: {
        type: String,
        required: [true, 'Message is required']
    },
    // Channel-specific fields using a flexible approach
    channel_data: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Channel-specific data is required']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for checking if OTP is expired
OtpSchema.virtual('isExpired').get(function() {
    return Date.now() > this.expire_at;
});

// Virtual for checking if OTP is valid (not expired, not used, and attempts not exceeded)
OtpSchema.virtual('isValid').get(function() {
    return !this.isExpired && !this.is_entered_successfully && this.num_failed_attempts < 4;
});

// Virtual for checking if OTP is locked (max attempts reached)
OtpSchema.virtual('isLocked').get(function() {
    return this.num_failed_attempts >= 4;
});

// Virtual for remaining attempts
OtpSchema.virtual('remainingAttempts').get(function() {
    return Math.max(0, 4 - this.num_failed_attempts);
});

// Static method to generate OTP value
OtpSchema.statics.generateOtpValue = function() {
    // Generate 6-digit numeric OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Static method to generate mixed alphanumeric OTP
OtpSchema.statics.generateMixedOtpValue = function() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Instance method to mark OTP as used
OtpSchema.methods.markAsUsed = async function() {
    // Use findOneAndUpdate for atomic operation to prevent parallel save conflicts
    const updatedOtp = await this.constructor.findOneAndUpdate(
        { _id: this._id },
        {
            $set: { 
                is_entered_successfully: true,
                updatedAt: Date.now()
            }
        },
        { new: true }
    );

    // Update the current document instance
    Object.assign(this, updatedOtp.toObject());
    
    return this;
};

// Instance method to increment attempts
OtpSchema.methods.incrementAttempts = async function() {
    // Use findOneAndUpdate for atomic operation to prevent parallel save conflicts
    const updatedOtp = await this.constructor.findOneAndUpdate(
        { _id: this._id },
        {
            $inc: { num_failed_attempts: 1 },
            $set: { updatedAt: Date.now() }
        },
        { new: true }
    );

    // Update the current document instance
    Object.assign(this, updatedOtp.toObject());
    
    return this;
};

// Instance method to validate OTP
OtpSchema.methods.validateOtp = async function(inputValue) {
    // Check if OTP is expired
    if (this.isExpired) {
        return { valid: false, message: 'OTP has expired' };
    }
    
    // Check if OTP has already been used successfully
    if (this.is_entered_successfully) {
        return { valid: false, message: 'OTP has already been used successfully' };
    }
    
    // Check if OTP is locked due to too many attempts
    if (this.isLocked) {
        return { valid: false, message: 'OTP is locked due to too many failed attempts' };
    }
    
    // Check if input value matches
    if (this.value !== inputValue) {
        // Increment attempts for failed verification
        await this.incrementAttempts();
        
        const remainingAttempts = this.remainingAttempts;
        if (remainingAttempts === 0) {
            return { valid: false, message: 'OTP is locked due to too many failed attempts' };
        } else {
            return { 
                valid: false, 
                message: `Invalid OTP. ${remainingAttempts} failed attempt(s) remaining` 
            };
        }
    }
    
    // OTP is valid - mark as used
    await this.markAsUsed();
    return { valid: true, message: 'OTP is valid' };
};

// Pre-save middleware to ensure expire_at is set correctly
OtpSchema.pre('save', function(next) {
    if (this.isNew && !this.expire_at) {
        this.expire_at = new Date(Date.now() + 90 * 1000);
    }
    next();
});

// Index for better query performance
OtpSchema.index({ organization: 1, channel_name: 1, created_at: -1 });
OtpSchema.index({ expire_at: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic cleanup

module.exports = mongoose.model('Otp', OtpSchema); 