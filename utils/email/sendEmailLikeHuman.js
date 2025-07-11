const sendEmail = require('./sendEmail');
const Otp = require('../../models/Otp');
const enqueueEmailJob = require('./emailQueue');

async function getOtpEmailsSentToday(email) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return await Otp.countDocuments({
        'channel_data.email': email,
        created_at: { $gte: startOfDay }
    });
}

async function sendEmailLikeHuman({ to, subject, message, html, maxPerDay = 450, minDelayMs = 2000, maxDelayMs = 6000, ...rest }) {
    // 1. Check daily limit using Otp model
    const sentToday = await getOtpEmailsSentToday(to);
    if (sentToday >= maxPerDay) {
        throw new Error(`Daily email limit of ${maxPerDay} reached for today.`);
    }

    // 2. Random delay to mimic human behavior
    const delay = Math.floor(Math.random() * (maxDelayMs - minDelayMs + 1)) + minDelayMs;
    await new Promise(res => setTimeout(res, delay));

    // 3. Send the email (map 'to' to 'email')
    await sendEmail({ email: to, subject, message, html, ...rest });

    // 4. Return info
    return { sent: true, to, subject, delayMs: delay, sentCountToday: sentToday + 1 };
}

function sendEmailLikeHumanQueued(params) {
    return new Promise((resolve, reject) => {
        enqueueEmailJob(async () => {
            try {
                const result = await sendEmailLikeHuman(params);
                resolve(result);
            } catch (e) {
                reject(e);
            }
        });
    });
}

module.exports = sendEmailLikeHumanQueued;
module.exports.sendEmailLikeHuman = sendEmailLikeHuman; 