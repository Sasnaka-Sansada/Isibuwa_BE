/**
 * config/mailer.js — Nodemailer transporter (Gmail SMTP)
 *
 * Uses an App Password — never a real Gmail password.
 * Steps to generate an App Password:
 *   Google Account → Security → 2-Step Verification → App Passwords
 */

'use strict';

const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST,
  port:   parseInt(process.env.MAIL_PORT, 10) || 587,
  secure: process.env.MAIL_SECURE === 'true', // false for port 587 (STARTTLS)
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  // Force IPv4 to prevent connection timeouts on Render (which lacks IPv6 support)
  family: 4,
});

// Verify connection at startup (non-fatal — log and continue if SMTP is unavailable)
transporter.verify((err) => {
  if (err) {
    console.warn('⚠️  SMTP connection warning:', err.message);
  } else {
    console.log('✅ Mailer ready');
  }
});

module.exports = transporter;
