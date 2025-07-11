const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

// Create Email (organization required)
router.post('/', emailService.createEmail);
// Get all Emails (optionally filter by organization)
router.get('/', emailService.getAllEmails);
// Get Email by ID
router.get('/:id', emailService.getEmailById);
// Update Email by ID
router.put('/:id', emailService.updateEmail);
// Delete Email by ID
router.delete('/:id', emailService.deleteEmail);

module.exports = router; 