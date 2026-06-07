/**
 * services/emailService.js — Nodemailer email templates
 *
 * All emails use inline CSS HTML templates for maximum email client compatibility.
 * Three exported functions:
 *  - sendBookingConfirmation(booking) — sent immediately after submission
 *  - sendApprovalEmail(booking, ticket) — sent when admin approves
 *  - sendRejectionEmail(booking) — sent when admin rejects
 */

'use strict';

const transporter = require('../config/mailer');
const QRCode      = require('qrcode');

const FROM_NAME  = 'Isibuwa Festival';
const FROM_EMAIL = process.env.MAIL_USER;

// ── Shared HTML wrapper ──────────────────────────────────────
function emailWrapper(title, bodyHtml) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0a1e;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1e;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1a1035;border-radius:16px;overflow:hidden;box-shadow:0 0 40px rgba(139,92,246,0.3);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#a855f7 100%);padding:40px 40px 30px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">🎵 Isibuwa Festival 2026</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Deraniyagala · Kegalle · June 6, 2026</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#0f0a1e;padding:24px 40px;text-align:center;border-top:1px solid rgba(139,92,246,0.2);">
              <p style="margin:0;color:rgba(255,255,255,0.4);font-size:12px;">
                © 2026 Isibuwa Festival · All rights reserved<br/>
                Questions? Email us at <a href="mailto:${FROM_EMAIL}" style="color:#a855f7;">${FROM_EMAIL}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ── 1. Booking Confirmation ──────────────────────────────────

/**
 * Sends a "booking received" confirmation to the attendee.
 * @param {{ name: string, email: string, event_title: string }} booking
 */
async function sendBookingConfirmation(booking) {
  const { name, email, event_title } = booking;

  const bodyHtml = `
    <h2 style="margin:0 0 16px;color:#ffffff;font-size:22px;">Hi ${name}! 👋</h2>
    <p style="margin:0 0 16px;color:rgba(255,255,255,0.75);font-size:15px;line-height:1.6;">
      We've received your booking for <strong style="color:#a855f7;">${event_title || 'Isibuwa Festival 2026'}</strong>.
      Your payment slip has been submitted and is currently under review.
    </p>
    <div style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);border-radius:12px;padding:20px 24px;margin:24px 0;">
      <p style="margin:0 0 8px;color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:1px;">Booking Summary</p>
      <p style="margin:0 0 4px;color:#fff;font-size:15px;"><strong>Name:</strong> ${name}</p>
      <p style="margin:0;color:#fff;font-size:15px;"><strong>Email:</strong> ${email}</p>
    </div>
    <p style="margin:0 0 16px;color:rgba(255,255,255,0.75);font-size:15px;line-height:1.6;">
      Our team will review your payment slip and notify you once your booking is approved. This usually takes 24–48 hours.
    </p>
    <p style="margin:0;color:rgba(255,255,255,0.5);font-size:14px;">
      Thank you for choosing Isibuwa Festival! 🎶
    </p>
  `;

  await transporter.sendMail({
    from:    `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to:      email,
    subject: `We received your booking — ${event_title || 'Isibuwa Festival 2026'}`,
    html:    emailWrapper('Booking Confirmation', bodyHtml),
  });
}

// ── 2. Approval Email ────────────────────────────────────────

/**
 * Sends an approval email with the unique ticket code.
 * @param {{ name: string, email: string, event_title: string, event_date: string, event_venue: string }} booking
 * @param {{ ticket_code: string }} ticket
 */
async function sendApprovalEmail(booking, ticket) {
  const { name, email, event_title, event_date, event_venue } = booking;
  const { ticket_code } = ticket;

  const formattedDate = event_date
    ? new Date(event_date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
      })
    : 'June 6, 2026';

  const qrData = JSON.stringify({
    ticket_code: ticket_code,
    name: name,
    email: email,
    phone: booking.phone || 'N/A',
    district: booking.district || 'N/A',
    event: event_title || 'Isibuwa Festival 2026'
  });

  const qrCodeBuffer = await QRCode.toBuffer(qrData, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 300,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  const bodyHtml = `
    <h2 style="margin:0 0 8px;color:#ffffff;font-size:22px;">Congratulations, ${name}! 🎉</h2>
    <p style="margin:0 0 24px;color:rgba(255,255,255,0.75);font-size:15px;line-height:1.6;">
      Your booking for <strong style="color:#a855f7;">${event_title || 'Isibuwa Festival 2026'}</strong> has been <strong style="color:#22c55e;">approved!</strong>
      Here is your unique ticket code and check-in QR code. Keep them safe!
    </p>
    <!-- Ticket Code Box -->
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:16px;padding:24px 32px 32px;text-align:center;margin:0 0 24px;">
      <p style="margin:0 0 8px;color:rgba(255,255,255,0.7);font-size:12px;text-transform:uppercase;letter-spacing:2px;">Your Ticket Code</p>
      <p style="margin:0;color:#ffffff;font-size:36px;font-weight:900;letter-spacing:4px;font-family:monospace;">${ticket_code}</p>
    </div>
    <!-- QR Code Box -->
    <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:28px;text-align:center;margin:0 0 24px;">
      <p style="margin:0 0 16px;color:rgba(255,255,255,0.7);font-size:12px;text-transform:uppercase;letter-spacing:2px;">Gate Entry QR Code</p>
      <div style="background:#ffffff;padding:16px;display:inline-block;border-radius:12px;margin:0 auto 12px;">
        <img src="cid:ticket_qrcode" alt="Ticket QR Code" style="width:200px;height:200px;display:block;margin:0;" />
      </div>
      <p style="margin:0;color:rgba(255,255,255,0.5);font-size:12px;line-height:1.4;">
        Show this QR Code at the entrance for verification.<br/>
        Ticket Ref: ${ticket_code}
      </p>
    </div>
    <!-- Event Details -->
    <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px 24px;margin:0 0 24px;">
      <p style="margin:0 0 8px;color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:1px;">Event Details</p>
      <p style="margin:0 0 6px;color:#fff;font-size:15px;">📅 <strong>${formattedDate}</strong></p>
      <p style="margin:0;color:#fff;font-size:15px;">📍 <strong>${event_venue || 'Deraniyagala, Kegalle'}</strong></p>
    </div>
    <p style="margin:0;color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;">
      Please bring either your ticket code or this QR code (digital or printed) to the venue for entry. We can't wait to see you there! 🎵
    </p>
  `;

  await transporter.sendMail({
    from:    `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to:      email,
    subject: `Your booking is approved! Ticket: ${ticket_code}`,
    html:    emailWrapper('Booking Approved', bodyHtml),
    attachments: [{
      filename: 'ticket-qrcode.png',
      content: qrCodeBuffer,
      cid: 'ticket_qrcode'
    }]
  });
}

// ── 3. Rejection Email ───────────────────────────────────────

/**
 * Sends a polite rejection email to the attendee.
 * @param {{ name: string, email: string, event_title: string }} booking
 */
async function sendRejectionEmail(booking) {
  const { name, email, event_title } = booking;

  const bodyHtml = `
    <h2 style="margin:0 0 16px;color:#ffffff;font-size:22px;">Hi ${name},</h2>
    <p style="margin:0 0 16px;color:rgba(255,255,255,0.75);font-size:15px;line-height:1.6;">
      We regret to inform you that your booking for <strong style="color:#a855f7;">${event_title || 'Isibuwa Festival 2026'}</strong> could not be approved at this time.
    </p>
    <p style="margin:0 0 16px;color:rgba(255,255,255,0.75);font-size:15px;line-height:1.6;">
      This may be due to an issue with the payment slip submitted. We apologize for any inconvenience this may cause.
    </p>
    <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:20px 24px;margin:24px 0;">
      <p style="margin:0;color:rgba(255,255,255,0.75);font-size:15px;line-height:1.6;">
        If you believe this is an error or would like to inquire further, please reach out to the event organizers directly at 
        <a href="mailto:${FROM_EMAIL}" style="color:#a855f7;">${FROM_EMAIL}</a>.
      </p>
    </div>
    <p style="margin:0;color:rgba(255,255,255,0.5);font-size:14px;">
      Thank you for your interest in Isibuwa Festival 2026. We hope to see you at future events!
    </p>
  `;

  await transporter.sendMail({
    from:    `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to:      email,
    subject: `Booking update — ${event_title || 'Isibuwa Festival 2026'}`,
    html:    emailWrapper('Booking Update', bodyHtml),
  });
}

module.exports = { sendBookingConfirmation, sendApprovalEmail, sendRejectionEmail };
