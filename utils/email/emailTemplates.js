const getOtpEmailHtml = (otpValue, organizationName = 'Our Service') => {
    const currentYear = new Date().getFullYear();
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .header p {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .otp-section {
            text-align: center;
            margin: 30px 0;
        }
        
        .otp-code {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-size: 32px;
            font-weight: bold;
            padding: 20px;
            border-radius: 8px;
            letter-spacing: 8px;
            margin: 20px 0;
            display: inline-block;
            min-width: 200px;
        }
        
        .message {
            font-size: 16px;
            color: #555;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
        }
        
        .warning h4 {
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .warning ul {
            margin-left: 20px;
            font-size: 13px;
        }
        
        .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        
        .footer p {
            font-size: 12px;
            color: #6c757d;
            margin-bottom: 5px;
        }
        
        .social-links {
            margin-top: 15px;
        }
        
        .social-links a {
            color: #667eea;
            text-decoration: none;
            margin: 0 10px;
            font-size: 12px;
        }
        
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 4px;
            }
            
            .content {
                padding: 20px 15px;
            }
            
            .otp-code {
                font-size: 24px;
                letter-spacing: 4px;
                padding: 15px;
            }
            
            .header {
                padding: 20px 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${organizationName}</h1>
            <p>Secure OTP Verification</p>
        </div>
        
        <div class="content">
            <div class="message">
                <p>Hello,</p>
                <p>You have requested a One-Time Password (OTP) for verification. Please use the code below to complete your verification process.</p>
            </div>
            
            <div class="otp-section">
                <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Your verification code is:</p>
                <div class="otp-code">${otpValue}</div>
                <p style="font-size: 12px; color: #999; margin-top: 10px;">This code will expire in 90 seconds</p>
            </div>
            
            <div class="warning">
                <h4>⚠️ Security Notice</h4>
                <ul>
                    <li>This code is valid for 90 seconds only</li>
                    <li>Never share this code with anyone</li>
                    <li>Our team will never ask for this code</li>
                    <li>If you didn't request this code, please ignore this email</li>
                </ul>
            </div>
            
            <div class="message">
                <p>If you have any questions or concerns, please don't hesitate to contact our support team.</p>
                <p>Thank you for choosing ${organizationName}!</p>
            </div>
        </div>
        
        <div class="footer">
            <p>© ${currentYear} ${organizationName}. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
            <div class="social-links">
                <a href="#">Privacy Policy</a> |
                <a href="#">Terms of Service</a> |
                <a href="#">Contact Support</a>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};

const getOtpEmailMessage = (otpValue, organizationName = 'Our Service') => {
    return `
${organizationName} - OTP Verification

Hello,

You have requested a One-Time Password (OTP) for verification. Please use the code below to complete your verification process.

Your verification code is: ${otpValue}

This code will expire in 90 seconds.

⚠️ Security Notice:
- This code is valid for 90 seconds only
- Never share this code with anyone
- Our team will never ask for this code
- If you didn't request this code, please ignore this message

If you have any questions or concerns, please don't hesitate to contact our support team.

Thank you for choosing ${organizationName}!

© ${new Date().getFullYear()} ${organizationName}. All rights reserved.
This is an automated message, please do not reply.
    `.trim();
};

module.exports = {
    getOtpEmailHtml,
    getOtpEmailMessage
}; 