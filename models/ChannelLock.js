const mongoose = require('mongoose');

const ChannelLockSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: [true, 'Organization is required']
    },
    channel_name: {
        type: String,
        required: [true, 'Channel name is required'],
        enum: ['whatsapp', 'email', 'sms'],
        lowercase: true
    },
    channel_identifier: {
        type: String,
        required: [true, 'Channel identifier is required'],
        // This will store phone number for WhatsApp/SMS or email for email channel
    },
    failed_attempts: {
        type: Number,
        default: 0,
        min: [0, 'Failed attempts cannot be negative']
    },
    lock_status: {
        type: String,
        enum: ['none', 'temporary', 'permanent'],
        default: 'none'
    },
    lock_start_time: {
        type: Date,
        default: null
    },
    lock_end_time: {
        type: Date,
        default: null
    },
    lock_duration_minutes: {
        type: Number,
        default: 0
    },
    last_attempt_time: {
        type: Date,
        default: Date.now
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Add a method to refresh lock state if lock expired
ChannelLockSchema.methods.refreshLockState = async function() {
    if (
        this.lock_status !== 'none' &&
        this.lock_end_time &&
        Date.now() >= this.lock_end_time
    ) {
        this.lock_status = 'none';
        this.lock_start_time = null;
        this.lock_end_time = null;
        this.lock_duration_minutes = 0;
        this.failed_attempts = 0;
        this.updated_at = Date.now();
        await this.save();
    }
};

// Virtual for checking if channel is currently locked
ChannelLockSchema.virtual('isLocked').get(function() {
    if (this.lock_status === 'none') return false;
    if (this.lock_status === 'permanent') return true;
    if (this.lock_end_time && Date.now() < this.lock_end_time && this.lock_status !== 'none') {
        return true;
    }
    return false;
});

// Virtual for remaining lock time in minutes
ChannelLockSchema.virtual('remainingLockTimeMinutes').get(function() {
    if (!this.isLocked || !this.lock_end_time) return 0;
    return Math.ceil((this.lock_end_time - Date.now()) / (1000 * 60));
});

// Virtual for remaining attempts before next lock
ChannelLockSchema.virtual('remainingAttempts').get(function() {
    const maxAttempts = 7;
    return Math.max(0, maxAttempts - this.failed_attempts);
});

// Instance method to increment failed attempts
ChannelLockSchema.methods.incrementFailedAttempts = async function() {
    await this.refreshLockState();
    // Atomically increment failed_attempts
    const updatedLock = await this.constructor.findOneAndUpdate(
        { _id: this._id },
        {
            $inc: { failed_attempts: 1 },
            $set: { last_attempt_time: Date.now(), updated_at: Date.now() }
        },
        { new: true }
    );
    Object.assign(this, updatedLock.toObject());

    // If failed_attempts reaches 7 or more, lock
    if (this.failed_attempts >= 7 && this.failed_attempts < 15) {
        await this.setLock('temporary', 1); // Use 20 for production
    } else if (this.failed_attempts >= 15) {
        await this.setLock('permanent', 0);
    }
    return this;
};

// Instance method to set lock
ChannelLockSchema.methods.setLock = async function(status, durationMinutes = 0) {
    const updateData = {
        lock_status: status,
        lock_start_time: Date.now(),
        lock_duration_minutes: durationMinutes,
        updated_at: Date.now()
    };
    if (status === 'permanent') {
        updateData.lock_end_time = null;
    } else if (durationMinutes > 0) {
        updateData.lock_end_time = new Date(Date.now() + durationMinutes * 60 * 1000);
    }
    const updatedLock = await this.constructor.findOneAndUpdate(
        { _id: this._id },
        { $set: updateData },
        { new: true }
    );
    Object.assign(this, updatedLock.toObject());
    return this;
};

// Instance method to reset failed attempts only (for successful verification)
ChannelLockSchema.methods.resetFailedAttempts = async function() {
    const updateData = {
        failed_attempts: 0,
        updated_at: Date.now()
    };
    const updatedLock = await this.constructor.findOneAndUpdate(
        { _id: this._id },
        { $set: updateData },
        { new: true }
    );
    Object.assign(this, updatedLock.toObject());
    return this;
};

// Instance method to reset lock (admin function)
ChannelLockSchema.methods.resetLock = async function() {
    const updateData = {
        lock_status: 'none',
        lock_start_time: null,
        lock_end_time: null,
        lock_duration_minutes: 0,
        failed_attempts: 0,
        updated_at: Date.now()
    };
    const updatedLock = await this.constructor.findOneAndUpdate(
        { _id: this._id },
        { $set: updateData },
        { new: true }
    );
    Object.assign(this, updatedLock.toObject());
    return this;
};

// Instance method to check if channel can request OTP
ChannelLockSchema.methods.canRequestOtp = function() {
    if (this.isLocked) {
        return {
            canRequest: false,
            reason: this.getLockReason(),
            remainingTime: this.remainingLockTimeMinutes
        };
    }
    
    return {
        canRequest: true,
        remainingAttempts: this.remainingAttempts
    };
};

// Instance method to get lock reason
ChannelLockSchema.methods.getLockReason = function() {
    switch (this.lock_status) {
        case 'temporary':
            return `${this.channel_identifier} temporarily locked due to too many failed attempts. Lock expires in ${this.remainingLockTimeMinutes} minutes.`;
        case 'permanent':
            return `${this.channel_identifier} permanently locked due to repeated failed attempts. Please contact support or use a different one.`;
        default:
            return `${this.channel_identifier} is not locked.`;
    }
};

// Static method to find or create channel lock
ChannelLockSchema.statics.findOrCreateLock = function(organizationId, channelName, channelIdentifier) {
    return this.findOneAndUpdate(
        {
            organization: organizationId,
            channel_name: channelName,
            channel_identifier: channelIdentifier
        },
        {
            $setOnInsert: {
                organization: organizationId,
                channel_name: channelName,
                channel_identifier: channelIdentifier
            }
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
        }
    );
};

// Pre-save middleware to update updated_at
ChannelLockSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

// Indexes for better performance
ChannelLockSchema.index({ organization: 1, channel_name: 1, channel_identifier: 1 });
ChannelLockSchema.index({ lock_end_time: 1 }, { expireAfterSeconds: 0 }); // TTL for automatic cleanup

module.exports = mongoose.model('ChannelLock', ChannelLockSchema); 