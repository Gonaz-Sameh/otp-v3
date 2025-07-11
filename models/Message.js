const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    number: { type: String, required: true },
    message: { type: String, required: true },
    datetime: { type: Date, required: false }, // Made optional for instant messages
    status: { type: String, enum: ['scheduled', 'sent'], default: 'scheduled' }
});

module.exports = mongoose.model('Message', MessageSchema);
