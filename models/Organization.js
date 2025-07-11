const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    whatsappAuth: {
        clientReady: { type: Boolean, default: false },
        authStrategy: { type: String, default: 'LocalAuth' }
    }
});

module.exports = mongoose.model('Organization', OrganizationSchema);
