const Organization = require("../models/Organization");
const Otp = require("../models/Otp");
const ChannelLock = require("../models/ChannelLock");
const asyncHandler = require('express-async-handler');
const factory = require('./handlersFactory');
const successResponseHandler = require("../middlewares/successResponseHandler");
const ApiError = require("../utils/apiError");
const whatsappClients = require("../utils/whatsapp/whatsappClients");
const Message = require("../models/Message");
const sendEmail = require("../utils/email/sendEmail");
const sendEmailLikeHuman = require('../utils/email/sendEmailLikeHuman');
const { sendWhatsappLikeHuman } = require('../utils/whatsapp/sendWhatsappLikeHuman');
const { getOtpEmailHtml, getOtpEmailMessage } = require("../utils/email/emailTemplates");
const initializeWhatsappClientsFromDatabase = require("../utils/whatsapp/initializeWhatsappClientsFromDatabase");
const { getOtpWhatsappMessage } = require('../utils/whatsapp/whatsappTemplates');

// Helper function to check channel lock status
const checkChannelLock = async (organizationId, channelName, channelIdentifier) => {
    const channelLock = await ChannelLock.findOrCreateLock(organizationId, channelName, channelIdentifier);
    return channelLock.canRequestOtp();
};

// Helper function to get channel lock and identifier
const getChannelLockAndIdentifier = async (otp) => {
    const channelIdentifier = otp.channel_data[otp.channel_name === 'whatsapp' ? 'number' : 'email'];
    const channelLock = await ChannelLock.findOrCreateLock(otp.organization, otp.channel_name, channelIdentifier);
    return { channelLock, channelIdentifier };
};

// @desc    create/request Whatsapp otp 
// @route   POST /api/v1/otp/request_otp/whatsapp
// @access  Public
exports.requestWhatsappOtp = asyncHandler(async (req, res, next) => {
    const organization = await Organization.findById(req.query.organizationId);
    if (!organization) return next(new ApiError("Organization Not Found", 400));
    
    const { number } = req.body;
    
    // Check channel lock status
    const lockStatus = await checkChannelLock(organization._id, 'whatsapp', number);
    if (!lockStatus.canRequest) {
        return next(new ApiError(lockStatus.reason, 429));
    }
    
    // Check WhatsApp client availability
    const client = whatsappClients.get(organization._id.toString());
    if (!client || !organization.whatsappAuth.clientReady) {
       // await initializeWhatsappClientsFromDatabase();
        return next(new ApiError("Please re-authenticate WhatsApp first.", 400));
    }

    // Generate OTP value
    const otpValue = Otp.generateOtpValue();
    const whatsappMessage = getOtpWhatsappMessage(otpValue, organization.name);

    // Send WhatsApp message with human-like behavior
    console.log("request_otp - Sending WhatsApp message with human-like behavior...");
    
  await sendWhatsappLikeHuman({
        number: number,
        message: whatsappMessage,
        organizationId: organization._id,
   });


    // Create OTP record
    const otp = await Otp.create({
        organization: organization._id,
        channel_name: 'whatsapp',
        message: whatsappMessage,
        value: otpValue,
        channel_data: {
            number: number
        }
    });
    
    return successResponseHandler(res, {
        message: "WhatsApp OTP sent successfully",
        data: {
            otpId: otp._id,
            expiresAt: otp.expire_at,
            remainingAttempts: lockStatus.remainingAttempts
        }
    });
});

// @desc    create/request Email otp 
// @route   POST /api/v1/otp/request_otp/email
// @access  Public
exports.requestEmailOtp = asyncHandler(async (req, res, next) => {
    const organization = await Organization.findById(req.query.organizationId);
    if (!organization) return next(new ApiError("Organization Not Found", 400));
    
    const { email } = req.body;

    // Check channel lock status
    const lockStatus = await checkChannelLock(organization._id, 'email', email);
    if (!lockStatus.canRequest) {
        return next(new ApiError(lockStatus.reason, 429));
    }

    // Generate OTP value
    const otpValue = Otp.generateOtpValue();
    // Generate professional email content using static functions
    const emailHtml = getOtpEmailHtml(otpValue, organization.name);
    const emailMessage = getOtpEmailMessage(otpValue, organization.name);

    // Send email with OTP using human-like behavior (queued)
    await sendEmailLikeHuman({
        to: email,
        subject: `Your OTP Verification Code - ${organization.name}`,
        message: emailMessage,
        html: emailHtml,
        organizationId: organization._id
    });

    // Create OTP record
    const otp = await Otp.create({
        organization: organization._id,
        channel_name: 'email',
        message: emailMessage,
        value: otpValue,
        channel_data: {
            email: email
        }
    });

    return successResponseHandler(res, {
        message: "Email OTP sent successfully",
        data: {
            otpId: otp._id,
            expiresAt: otp.expire_at,
            remainingAttempts: lockStatus.remainingAttempts
        }
    });
});

// @desc    verify OTP
// @route   POST /api/v1/otp/verify
// @access  Public
exports.verifyOtp = asyncHandler(async (req, res, next) => {
    const { otpId, value } = req.body;

    // Find OTP record
    const otp = await Otp.findById(otpId);
    if (!otp) {
        return next(new ApiError("OTP not found", 404));
    }

    // Check if OTP belongs to the organization
    if (otp.organization._id.toString() !== req.query.organizationId) {
        return next(new ApiError("Invalid OTP for this organization", 400));
    }

    // Validate OTP (this will handle attempts, expiration, and usage)
    const validation = await otp.validateOtp(value);
    if (!validation.valid) {
        // If OTP validation failed, increment channel failed attempts
        const { channelLock } = await getChannelLockAndIdentifier(otp);
        await channelLock.incrementFailedAttempts();
        
        return next(new ApiError(validation.message, 400));
    }

    // If OTP verification is successful, reset channel failed attempts
    const { channelLock } = await getChannelLockAndIdentifier(otp);
    
    // Reset failed attempts on successful verification
    if (channelLock.failed_attempts > 0) {
        await channelLock.resetFailedAttempts();
    }

    return successResponseHandler(res, {
        message: "OTP verified successfully",
        data: {
            verified: true,
            otpFailedAttemptsUsed: otp.num_failed_attempts,
            otpTotalAllowedAttempts: 4
        }
    });
});

// @desc    get OTP status (without verification)
// @route   GET /api/v1/otp/:id/status
// @access  Public
exports.getOtpStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { organizationId } = req.query;

    // Find OTP record
    const otp = await Otp.findById(id);
    if (!otp) {
        return next(new ApiError("OTP not found", 404));
    }

    // Check if OTP belongs to the organization
    if (otp.organization._id.toString() !== organizationId) {
        return next(new ApiError("Invalid OTP for this organization", 400));
    }

    return successResponseHandler(res, {
        data: {
            id: otp._id,
            isExpired: otp.isExpired,
            isUsed: otp.is_entered_successfully,
            isLocked: otp.isLocked,
            isValid: otp.isValid,
            failedAttemptsUsed: otp.num_failed_attempts,
            remainingAttempts: otp.remainingAttempts,
            totalAttempts: 4,
            createdAt: otp.created_at,
            expiresAt: otp.expire_at,
            channelName: otp.channel_name,
            timeRemaining: Math.max(0, otp.expire_at - Date.now())
        }
    });
});

// @desc    get channel lock status
// @route   GET /api/v1/otp/channel/status
// @access  Public
exports.getChannelLockStatus = asyncHandler(async (req, res, next) => {
    console.log("ddddddddddddddddddd");
    
    const { organizationId, channelName, channelIdentifier } = req.query;
console.log(organizationId,channelName,channelIdentifier);

    if (!organizationId || !channelName || !channelIdentifier) {
        return next(new ApiError("Organization ID, channel name, and channel identifier are required", 400));
    }

    const channelLock = await ChannelLock.findOrCreateLock(organizationId, channelName, channelIdentifier);
    const lockStatus = channelLock.canRequestOtp();

    return successResponseHandler(res, {
        data: {
            channelName: channelName,
            channelIdentifier: channelIdentifier,
            isLocked: channelLock.isLocked,
            lockStatus: channelLock.lock_status,
            failedAttempts: channelLock.failed_attempts,
            remainingAttempts: channelLock.remainingAttempts,
            maxAttempts: 7,
            lockStartTime: channelLock.lock_start_time,
            lockEndTime: channelLock.lock_end_time,
            remainingLockTimeMinutes: channelLock.remainingLockTimeMinutes,
            lastAttemptTime: channelLock.last_attempt_time,
            canRequestOtp: lockStatus.canRequest,
            reason: lockStatus.reason || null
        }
    });
});

// @desc    reset channel lock (admin function)
// @route   POST /api/v1/otp/channel/reset
// @access  Public
exports.resetChannelLock = asyncHandler(async (req, res, next) => {
    const {  channelName, channelIdentifier } = req.body;

    if (!req.query.organizationId || !channelName || !channelIdentifier) {
        return next(new ApiError("Organization ID, channel name, and channel identifier are required", 400));
    }

    const channelLock = await ChannelLock.findOrCreateLock(req.query.organizationId, channelName, channelIdentifier);
    await channelLock.resetLock();

    return successResponseHandler(res, {
        message: "Channel lock reset successfully",
        data: {
            channelName: channelName,
            channelIdentifier: channelIdentifier,
            isLocked: false,
            lockStatus: 'none',
            failedAttempts: 0,
            remainingAttempts: 7
        }
    });
});

// @desc    get OTP by ID
// @route   GET /api/v1/otp/:id
// @access  Public
exports.getOtp = factory.getOne(Otp);

// @desc    get all OTPs for organization
// @route   GET /api/v1/otp/organization/:organizationId
// @access  Public
exports.getOtpsByOrganization = asyncHandler(async (req, res, next) => {
    const { organizationId } = req.params;
    const { channel_name, limit = 10, page = 1 } = req.query;

    const filter = { organization: organizationId };
    if (channel_name) {
        filter.channel_name = channel_name;
    }

    const otps = await Otp.find(filter)
        .sort({ created_at: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('organization', 'name');

    const total = await Otp.countDocuments(filter);

    return successResponseHandler(res, {
        data: otps,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit
        }
    });
});