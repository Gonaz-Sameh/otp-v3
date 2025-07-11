const express = require('express');
const {
  requestWhatsappOtp,
  requestEmailOtp,
  verifyOtp,
  getOtp,
  getOtpsByOrganization,
  getOtpStatus,
  getChannelLockStatus,
  resetChannelLock
} = require('../services/otpService');

const {
  requestWhatsappOtpValidator,
  requestEmailOtpValidator,
  verifyOtpValidator
} = require('../utils/validators/otpValidator');

const router = express.Router();

// Request OTP routes
router
  .route('/request_otp/whatsapp')
  .post(requestWhatsappOtpValidator, requestWhatsappOtp);

router
  .route('/request_otp/email')
  .post(requestEmailOtpValidator, requestEmailOtp);

// Verify OTP route
router
  .route('/verify')
  .post(verifyOtpValidator, verifyOtp);

// Channel lock routes (must come before :id routes)
router
  .route('/channel/status')
  .get(getChannelLockStatus);

router
  .route('/channel/reset')
  .post(resetChannelLock);

// Get OTP routes (must come after specific routes)
router
  .route('/:id/status')
  .get(getOtpStatus);

router
  .route('/:id')
  .get(getOtp);

router
  .route('/organization/:organizationId')
  .get(getOtpsByOrganization);

module.exports = router;
