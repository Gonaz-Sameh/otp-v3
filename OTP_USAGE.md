# OTP System Documentation

## Overview

The OTP (One-Time Password) system provides a flexible way to send and verify OTPs through different channels (WhatsApp, Email, SMS). The system automatically generates 6-digit OTPs, handles expiration (90 seconds), tracks usage status, limits verification attempts to 4 per OTP, and implements progressive channel locking based on failed attempts.

## Channel Locking System

### Progressive Locking Strategy
The system implements a three-tier locking mechanism for channels (phone numbers/emails):

1. **Temporary Lock (30 minutes)**: First time reaching 7 failed attempts
2. **Extended Lock (2 hours)**: Second time reaching 7 failed attempts  
3. **Permanent Lock**: Third time reaching 7 failed attempts

### Lock Periods
- **Temporary**: 30 minutes
- **Extended**: 2 hours (120 minutes)
- **Permanent**: Forever (requires admin intervention or new channel)

### Attempt Tracking
- **Maximum attempts per channel**: 7 before locking
- **Lock triggers**: When channel reaches 7 failed attempts
- **Reset conditions**: Lock expires (temporary/extended) or admin reset

## OTP Model Structure

### Core Fields
- `organization`: Reference to the organization (required)
- `created_at`: Timestamp when OTP was created (auto-generated)
- `expire_at`: Expiration timestamp (90 seconds from creation)
- `value`: 6-digit OTP value (auto-generated)
- `is_entered_successfully`: Boolean flag for usage status (default: false)
- `num_attempts`: Number of verification attempts (0-4, default: 0)
- `channel_name`: Channel type ('whatsapp', 'email', 'sms')
- `message`: The message template to send with OTP
- `channel_data`: Flexible object for channel-specific data

### Channel Lock Model Fields
- `organization`: Reference to the organization
- `channel_name`: Channel type ('whatsapp', 'email', 'sms')
- `channel_identifier`: Phone number or email address
- `failed_attempts`: Number of failed attempts (0-7+)
- `lock_status`: Lock status ('none', 'temporary', 'extended', 'permanent')
- `lock_start_time`: When lock was applied
- `lock_end_time`: When lock expires (null for permanent)
- `lock_duration_minutes`: Duration of lock in minutes
- `last_attempt_time`: Last attempt timestamp

## API Endpoints

### 1. Request WhatsApp OTP
```http
POST /api/v1/otp/request_otp/whatsapp?organizationId=ORG_ID
Content-Type: application/json

{
    "number": "1234567890",
    "message": "Your verification code is: "
}
```

**Success Response:**
```json
{
    "status": "success",
    "message": "WhatsApp OTP sent successfully",
    "data": {
        "otpId": "60f7b3b3b3b3b3b3b3b3b3b3",
        "expiresAt": "2024-01-15T10:30:45.123Z",
        "remainingAttempts": 6
    }
}
```

**Channel Locked Response:**
```json
{
    "status": "error",
    "message": "Channel temporarily locked due to too many failed attempts. Lock expires in 25 minutes."
}
```

### 2. Request Email OTP
```http
POST /api/v1/otp/request_otp/email?organizationId=ORG_ID
Content-Type: application/json

{
    "email": "user@example.com",
    "message": "Your verification code is: ",
    "html": "<p>Your verification code is: <strong>{otp}</strong></p>"
}
```

**Success Response:**
```json
{
    "status": "success",
    "message": "Email OTP sent successfully",
    "data": {
        "otpId": "60f7b3b3b3b3b3b3b3b3b3b3",
        "expiresAt": "2024-01-15T10:30:45.123Z",
        "remainingAttempts": 5
    }
}
```

### 3. Verify OTP
```http
POST /api/v1/otp/verify
Content-Type: application/json

{
    "otpId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "value": "123456"
}
```

**Success Response:**
```json
{
    "status": "success",
    "message": "OTP verified successfully",
    "data": {
        "verified": true,
        "attemptsUsed": 1,
        "totalAttempts": 4
    }
}
```

**Failed Verification Response:**
```json
{
    "status": "error",
    "message": "Invalid OTP. 2 attempt(s) remaining"
}
```

### 4. Get Channel Lock Status
```http
GET /api/v1/otp/channel/status?organizationId=ORG_ID&channelName=whatsapp&channelIdentifier=1234567890
```

**Response:**
```json
{
    "status": "success",
    "data": {
        "channelName": "whatsapp",
        "channelIdentifier": "1234567890",
        "isLocked": false,
        "lockStatus": "none",
        "failedAttempts": 2,
        "remainingAttempts": 5,
        "maxAttempts": 7,
        "lockStartTime": null,
        "lockEndTime": null,
        "remainingLockTimeMinutes": 0,
        "lastAttemptTime": "2024-01-15T10:25:30.123Z",
        "canRequestOtp": true,
        "reason": null
    }
}
```

**Locked Channel Response:**
```json
{
    "status": "success",
    "data": {
        "channelName": "whatsapp",
        "channelIdentifier": "1234567890",
        "isLocked": true,
        "lockStatus": "temporary",
        "failedAttempts": 7,
        "remainingAttempts": 0,
        "maxAttempts": 7,
        "lockStartTime": "2024-01-15T10:20:00.000Z",
        "lockEndTime": "2024-01-15T10:50:00.000Z",
        "remainingLockTimeMinutes": 25,
        "lastAttemptTime": "2024-01-15T10:20:00.000Z",
        "canRequestOtp": false,
        "reason": "Channel temporarily locked due to too many failed attempts. Lock expires in 25 minutes."
    }
}
```

### 5. Reset Channel Lock (Admin)
```http
POST /api/v1/otp/channel/reset
Content-Type: application/json

{
    "organizationId": "ORG_ID",
    "channelName": "whatsapp",
    "channelIdentifier": "1234567890"
}
```

**Response:**
```json
{
    "status": "success",
    "message": "Channel lock reset successfully",
    "data": {
        "channelName": "whatsapp",
        "channelIdentifier": "1234567890",
        "isLocked": false,
        "lockStatus": "none",
        "failedAttempts": 0,
        "remainingAttempts": 7
    }
}
```

### 6. Get OTP Status
```http
GET /api/v1/otp/OTP_ID/status?organizationId=ORG_ID
```

### 7. Get OTP by ID
```http
GET /api/v1/otp/OTP_ID
```

### 8. Get OTPs by Organization
```http
GET /api/v1/otp/organization/ORG_ID?channel_name=whatsapp&limit=10&page=1
```

## Validation Rules

### WhatsApp OTP Request
- `organizationId`: Required, valid MongoDB ObjectId (in query params)
- `number`: Required, 10-15 digits only
- `message`: Required, 1-1000 characters
- **Channel Lock Check**: Must not be locked

### Email OTP Request
- `organizationId`: Required, valid MongoDB ObjectId (in query params)
- `email`: Required, valid email format
- `message`: Required, 1-1000 characters
- `html`: Optional, string
- **Channel Lock Check**: Must not be locked

### OTP Verification
- `otpId`: Required, valid MongoDB ObjectId
- `value`: Required, exactly 6 characters
- `organizationId`: Required, valid MongoDB ObjectId (in URL params)

## Channel Locking Logic

### Lock Progression
1. **0-6 failed attempts**: Channel can request OTPs normally
2. **7 failed attempts (1st time)**: Temporary lock (30 minutes)
3. **7 failed attempts (2nd time)**: Extended lock (2 hours)
4. **7 failed attempts (3rd time)**: Permanent lock (forever)

### Success Rewards
- **Successful OTP verification**: Resets channel failed attempts to 0
- **Encourages retry**: Users get a fresh start after successful verification
- **Better UX**: Prevents permanent locks for legitimate users

### Lock Messages
- **Temporary Lock**: "Channel temporarily locked due to too many failed attempts. Lock expires in X minutes."
- **Extended Lock**: "Channel locked for extended period due to repeated failed attempts. Lock expires in X minutes."
- **Permanent Lock**: "Channel permanently locked due to repeated failed attempts. Please contact support or use a different channel."

### Attempt Tracking
- **Channel Level**: Tracks failed attempts per phone number/email
- **OTP Level**: Tracks verification attempts per individual OTP (max 4)
- **Automatic Increment**: Failed OTP verification increments channel attempts
- **Success Reset**: Successful OTP verification resets channel attempts to 0
- **Reset Conditions**: Lock expiration, admin reset, or successful verification

## OTP Generation Methods

### Numeric OTP (Default)
```javascript
const otpValue = Otp.generateOtpValue(); // Returns "123456"
```

### Alphanumeric OTP
```javascript
const otpValue = Otp.generateMixedOtpValue(); // Returns "A1B2C3"
```

## Model Methods

### Channel Lock Methods
```javascript
// Check if channel can request OTP
const lockStatus = channelLock.canRequestOtp();
if (lockStatus.canRequest) {
    console.log(`Can request OTP. ${lockStatus.remainingAttempts} attempts remaining`);
} else {
    console.log(lockStatus.reason);
}

// Increment failed attempts
await channelLock.incrementFailedAttempts();

// Reset lock (admin function)
await channelLock.resetLock();

// Check lock status
const isLocked = channelLock.isLocked;
const remainingTime = channelLock.remainingLockTimeMinutes;
```

### OTP Methods
```javascript
// Check if OTP is expired
const isExpired = otp.isExpired;

// Check if OTP is valid (not expired, not used, and attempts < 4)
const isValid = otp.isValid;

// Check if OTP is locked (max attempts reached)
const isLocked = otp.isLocked;

// Get remaining attempts
const remainingAttempts = otp.remainingAttempts;

// Mark OTP as used
await otp.markAsUsed();

// Validate OTP input
const validation = otp.validateOtp("123456");
if (validation.valid) {
    console.log("OTP is valid");
} else {
    console.log(validation.message);
}
```

## Error Handling

The system handles various error scenarios:

1. **Organization Not Found**: When organizationId is invalid
2. **WhatsApp Not Authenticated**: When WhatsApp client is not ready
3. **OTP Not Found**: When otpId is invalid
4. **OTP Expired**: When OTP has passed its 90-second expiration
5. **OTP Already Used**: When OTP has been previously verified successfully
6. **OTP Locked**: When OTP has reached maximum attempts (4)
7. **Invalid OTP**: When the provided value doesn't match (with remaining attempts)
8. **Invalid Organization**: When OTP doesn't belong to the specified organization
9. **Channel Locked**: When channel is locked due to too many failed attempts
10. **Channel Permanently Locked**: When channel requires admin intervention

## Database Indexes

The OTP model includes optimized indexes for better performance:

- `{ organization: 1, channel_name: 1, created_at: -1 }`: For querying OTPs by organization and channel
- `{ expire_at: 1 }`: TTL index for automatic cleanup of expired OTPs

The Channel Lock model includes:

- `{ organization: 1, channel_name: 1, channel_identifier: 1 }`: For querying channel locks
- `{ lock_end_time: 1 }`: TTL index for automatic cleanup of expired locks

## Adding New Channels

To add a new channel (e.g., SMS), follow these steps:

1. **Update the OTP model enum**:
```javascript
channel_name: {
    type: String,
    required: [true, 'Channel name is required'],
    enum: ['whatsapp', 'email', 'sms', 'new_channel'],
    lowercase: true
}
```

2. **Update the Channel Lock model enum**:
```javascript
channel_name: {
    type: String,
    required: [true, 'Channel name is required'],
    enum: ['whatsapp', 'email', 'sms', 'new_channel'],
    lowercase: true
}
```

3. **Add validator**:
```javascript
exports.requestNewChannelOtpValidator = [
    ...exports.requestOtpValidator,
    check('new_field')
        .notEmpty()
        .withMessage('New field is required'),
    validatorMiddleware,
];
```

4. **Add service method**:
```javascript
exports.requestNewChannelOtp = asyncHandler(async (req, res, next) => {
    // Implementation similar to WhatsApp/Email methods
});
```

5. **Add route**:
```javascript
router
    .route('/request_otp/new_channel')
    .post(requestNewChannelOtpValidator, requestNewChannelOtp);
```

## Security Considerations

1. **OTP Expiration**: All OTPs expire after 90 seconds
2. **Single Use**: OTPs can only be used once successfully
3. **Attempt Limiting**: Maximum 4 verification attempts per OTP
4. **Channel Locking**: Progressive locking system prevents abuse
5. **Organization Isolation**: OTPs and locks are tied to specific organizations
6. **Input Validation**: All inputs are validated and sanitized
7. **Automatic Cleanup**: Expired OTPs and locks are automatically removed
8. **Attempt Tracking**: Failed attempts are tracked at both OTP and channel levels
9. **Progressive Security**: Lock periods increase with repeated violations
10. **Admin Control**: Channel locks can be reset by administrators 