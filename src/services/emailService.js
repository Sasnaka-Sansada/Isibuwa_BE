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
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:#0C0A07;font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0C0A07;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#17130D;border-radius:16px;overflow:hidden;border:1px solid #382C18;box-shadow:0 20px 50px rgba(201,146,42,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#0C0A07;padding:40px 40px 30px;text-align:center;border-bottom:1px solid #382C18;">
              <h1 style="margin:0;color:#F0D080;font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;font-weight:600;letter-spacing:4px;text-transform:uppercase;">ISIMBUWA</h1>
              <p style="margin:10px 0 0;color:#C4B89A;font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:400;">Deraniyagala · Kegalle · July 25, 2026</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;background-color:#17130D;color:#FAF5E4;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#0C0A07;padding:24px 40px;text-align:center;border-top:1px solid #382C18;">
              <p style="margin:0;color:#C4B89A;font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.6;letter-spacing:0.5px;">
                © 2026 Isibuwa Festival · All rights reserved<br/>
                Questions? Email us at <a href="mailto:${FROM_EMAIL}" style="color:#C9922A;text-decoration:none;font-weight:600;">${FROM_EMAIL}</a>
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
    <h2 style="margin:0 0 16px;color:#FAF5E4;font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:600;">Hi ${name}! 👋</h2>
    <p style="margin:0 0 20px;color:#C4B89A;font-size:15px;line-height:1.8;">
      We've received your booking for <strong style="color:#C9922A;">${event_title || 'Isibuwa Festival 2026'}</strong>.
      Your payment slip has been submitted and is currently under review.
    </p>
    <div style="background-color:#241D13;border:1px solid #382C18;border-radius:12px;padding:20px 24px;margin:24px 0;">
      <p style="margin:0 0 10px;color:#C9922A;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif;">Booking Summary</p>
      <p style="margin:0 0 6px;color:#FAF5E4;font-size:14px;line-height:1.5;"><strong>Name:</strong> ${name}</p>
      <p style="margin:0;color:#FAF5E4;font-size:14px;line-height:1.5;"><strong>Email:</strong> ${email}</p>
    </div>
    <p style="margin:0 0 20px;color:#C4B89A;font-size:15px;line-height:1.8;">
      Our team will review your payment slip and notify you once your booking is approved. This usually takes 24–48 hours.
    </p>
    <p style="margin:0;color:#C4B89A;font-size:14px;font-style:italic;">
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
        hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Colombo',
      })
    : 'Saturday, July 25, 2026 at 06:00 PM';

  const bodyHtml = `
    <h2 style="margin:0 0 8px;color:#FAF5E4;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;letter-spacing:0.5px;">Congratulations, ${name}! 🎉</h2>
    <p style="margin:0 0 24px;color:#C4B89A;font-size:15px;line-height:1.8;">
      Your booking for <strong style="color:#C9922A;">${event_title || 'Isibuwa Festival 2026'}</strong> has been <strong style="color:#10B981;">approved!</strong>
      Here is your unique ticket code. Keep it safe!
    </p>
    <!-- Ticket Code Box -->
    <div style="background-color:#241D13;border:2px dashed #C9922A;border-radius:16px;padding:28px 24px;text-align:center;margin:0 0 28px;box-shadow:inset 0 0 20px rgba(201,146,42,0.05);">
      <p style="margin:0 0 8px;color:#C4B89A;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:500;">Your Ticket Code</p>
      <p style="margin:0;color:#F0D080;font-size:32px;font-weight:800;letter-spacing:4px;font-family:Consolas, Monaco, monospace;">${ticket_code}</p>
    </div>
    <!-- Event Details -->
    <div style="background-color:#241D13;border:1px solid #382C18;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
      <p style="margin:0 0 10px;color:#C9922A;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif;">Event Details</p>
      <p style="margin:0 0 8px;color:#FAF5E4;font-size:14px;line-height:1.5;">📅 <strong style="margin-left:4px;">${formattedDate}</strong></p>
      <p style="margin:0;color:#FAF5E4;font-size:14px;line-height:1.5;">📍 <strong style="margin-left:4px;">${event_venue || 'Deraniyagala, Kegalle'}</strong></p>
    </div>
    <!-- Highlighted WhatsApp Group Link -->
    <div style="background-color:#142318;border:2px solid #25D366;border-radius:12px;padding:24px;margin:0 0 24px;text-align:center;box-shadow:0 4px 20px rgba(37,211,102,0.18);">
      <p style="margin:0 0 8px;color:#25D366;font-size:12px;text-transform:uppercase;letter-spacing:2px;font-weight:700;font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif;">💬 Official Attendee WhatsApp Group</p>
      <p style="margin:0 0 16px;color:#FAF5E4;font-size:15px;line-height:1.6;font-weight:600;">
        Please join the WhatsApp group using the link below:
      </p>
      <a href="https://chat.whatsapp.com/IFzyh6nIPEoLgegJILFxKe?s=cl&p=a&ilr=4&amv=0" target="_blank" style="display:inline-block;background-color:#25D366;color:#0C0A07;font-weight:700;font-size:15px;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;box-shadow:0 4px 14px rgba(37,211,102,0.35);">
        Join WhatsApp Group →
      </a>
      <p style="margin:14px 0 0;color:#C4B89A;font-size:12px;word-break:break-all;">
        <a href="https://chat.whatsapp.com/IFzyh6nIPEoLgegJILFxKe?s=cl&p=a&ilr=4&amv=0" style="color:#25D366;text-decoration:underline;">https://chat.whatsapp.com/IFzyh6nIPEoLgegJILFxKe?s=cl&p=a&ilr=4&amv=0</a>
      </p>
    </div>
    <p style="margin:0;color:#C4B89A;font-size:14px;line-height:1.8;">
      Please bring your ticket code (digital or printed) to the venue for gate entry. We can't wait to see you there! 🎵
    </p>
  `;

  await transporter.sendMail({
    from:    `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to:      email,
    subject: `Your booking is approved! Ticket: ${ticket_code}`,
    html:    emailWrapper('Booking Approved', bodyHtml),
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
    <h2 style="margin:0 0 16px;color:#FAF5E4;font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:600;">Hi ${name},</h2>
    <p style="margin:0 0 20px;color:#C4B89A;font-size:15px;line-height:1.8;">
      We regret to inform you that your booking for <strong style="color:#C9922A;">${event_title || 'Isibuwa Festival 2026'}</strong> could not be approved at this time.
    </p>
    <p style="margin:0 0 20px;color:#C4B89A;font-size:15px;line-height:1.8;">
      This may be due to an issue with the payment slip submitted. We apologize for any inconvenience this may cause.
    </p>
    <div style="background-color:#1F1414;border:1px solid #7F1D1D;border-radius:12px;padding:20px 24px;margin:24px 0;">
      <p style="margin:0;color:#FAF5E4;font-size:14px;line-height:1.8;">
        If you believe this is an error or would like to inquire further, please reach out to the event organizers directly at 
        <a href="mailto:${FROM_EMAIL}" style="color:#C9922A;text-decoration:none;font-weight:600;">${FROM_EMAIL}</a>.
      </p>
    </div>
    <p style="margin:0;color:#C4B89A;font-size:14px;font-style:italic;">
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
