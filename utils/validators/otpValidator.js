const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

// Common OTP request validator
exports.requestOtpValidator = [
    check('organizationId')
        .notEmpty()
        .withMessage('Organization ID is required')
        .isMongoId()
        .withMessage('Invalid Organization ID format'),

    check('message')
        .notEmpty()
        .withMessage('Message is required')
        .isLength({ min: 1, max: 1000 })
        .withMessage('Message must be between 1 and 1000 characters'),

    validatorMiddleware,
];

// WhatsApp specific validator
exports.requestWhatsappOtpValidator = [

    check('number')
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^[0-9]+$/)
        .withMessage('Phone number must contain only digits')
        .isLength({ min: 10, max: 15 })
        .withMessage('Phone number must be between 10 and 15 digits'),

    validatorMiddleware,
];

// Email specific validator
exports.requestEmailOtpValidator = [
    check('email')
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email format'),
    validatorMiddleware,
];

// SMS specific validator (for future use)
exports.requestSmsOtpValidator = [
    ...exports.requestOtpValidator,
    check('number')
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^[0-9]+$/)
        .withMessage('Phone number must contain only digits')
        .isLength({ min: 10, max: 15 })
        .withMessage('Phone number must be between 10 and 15 digits'),

    validatorMiddleware,
];

// OTP verification validator
exports.verifyOtpValidator = [
    check('otpId')
        .notEmpty()
        .withMessage('OTP ID is required')
        .isMongoId()
        .withMessage('Invalid OTP ID format'),

    check('value')
        .notEmpty()
        .withMessage('OTP value is required')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be exactly 6 characters'),

    validatorMiddleware,
]; 