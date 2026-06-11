const { Resend } = require('resend');
require('dotenv').config();

if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is not set in environment variables');
}

// Use a placeholder key during boot so require() doesn't throw.
// All actual email calls are guarded in email.service.js.
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

module.exports = resend;
