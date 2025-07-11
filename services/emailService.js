const Email = require('../models/Email');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');

// Create Email
exports.createEmail = asyncHandler(async (req, res, next) => {
    const { email_host, email_port, email_user, email_password, organization } = req.body;
    if (!organization) {
        return next(new ApiError('Organization ID is required', 400));
    }
    const email = await Email.create({ email_host, email_port, email_user, email_password, organization });
    res.status(201).json({ data: email });
});

// Get all Emails (optionally filter by organization)
exports.getAllEmails = asyncHandler(async (req, res, next) => {
    const filter = {};
    if (req.query.organization) {
        filter.organization = req.query.organization;
    }
    const emails = await Email.find(filter);
    res.status(200).json({ results: emails.length, data: emails });
});

// Get Email by ID
exports.getEmailById = asyncHandler(async (req, res, next) => {
    const email = await Email.findById(req.params.id);
    if (!email) {
        return next(new ApiError('Email not found', 404));
    }
    res.status(200).json({ data: email });
});

// Update Email by ID
exports.updateEmail = asyncHandler(async (req, res, next) => {
    const email = await Email.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!email) {
        return next(new ApiError('Email not found', 404));
    }
    res.status(200).json({ data: email });
});

// Delete Email by ID
exports.deleteEmail = asyncHandler(async (req, res, next) => {
    const email = await Email.findByIdAndDelete(req.params.id);
    if (!email) {
        return next(new ApiError('Email not found', 404));
    }
    res.status(204).send();
}); 