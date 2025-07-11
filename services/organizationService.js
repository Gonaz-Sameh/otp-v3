const Organization = require("../models/Organization");
const asyncHandler = require('express-async-handler');
const factory = require('./handlersFactory');
const successResponseHandler = require("../middlewares/successResponseHandler");
const ApiError = require("../utils/apiError");
const authenticateWhatsappClient = require("../utils/whatsapp/authenticateWhatsappClient");
const Email = require('../models/Email');
// @desc    Get list of Organizations
// @route   GET /api/v1/organizations
// @access  Puplic
exports.getOrganizations  = factory.getAll(Organization);

// @desc    Get specific Organization  by id
// @route   GET /api/v1/organizations/:id
// @access  Puplic
exports.getOrganization = factory.getOne(Organization);
// @desc    create Organization 
// @route   POST /api/v1/organizations
// @access  Puplic
exports.createOrganization = asyncHandler(async (req, res, next) => {
        const { name } = req.body;
        // Check if the organization already exists
        const organization = await Organization.findOne({ name });
        if (organization) {
            return next(new ApiError("Organization already exists", 400));
        }
        // Create and save the new bot organization
        const newOrganization = new Organization({ name });
        await newOrganization.save();

        return successResponseHandler(res,"Organization added successfully", 201);
  });

  exports.organizationWhatsappAuth = asyncHandler(async (req, res, next) => {
    const isAuthenticated = await authenticateWhatsappClient(req.params.organizationId);
    if (isAuthenticated) {
        return successResponseHandler(res, `Whatsapp Client For Organization : ${req.params.organizationId} Is Auth successfully`);
    }
});
exports.organizationEmailAuth = asyncHandler(async (req, res, next) => {
    const organizationId = req.params.organizationId;
    const organization = await Organization.findById(organizationId);
    if (!organization) {
        return next(new ApiError('Organization not found', 404));
    }
    // Collect email data from req.body
    const { email_host, email_port, email_user, email_password } = req.body;
    if (!email_host || !email_port || !email_user || !email_password) {
        return next(new ApiError('All email fields are required', 400));
    }
   
    // Create the Email document associated with the organization
    const email = await Email.create({
        email_host,
        email_port,
        email_user,
        email_password,
        organization: organizationId
    });
    return successResponseHandler(res, `Email created and associated with Organization: ${organizationId} successfully`, 201, { email });
});