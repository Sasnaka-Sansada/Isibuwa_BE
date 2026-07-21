/**
 * controllers/bookingController.js — Public booking submission
 *
 * POST /api/bookings
 * Middleware chain: uploadSlip → validate(bookingSchema) → createBooking
 *
 * Security:
 *  - Capacity check runs inside a DB transaction with advisory lock to
 *    prevent race conditions where two simultaneous requests could both
 *    pass the count check and push capacity over 150.
 *  - All queries use parameterized statements ($1, $2, ...).
 */

'use strict';

const pool = require('../config/db');
const { sendBookingConfirmation } = require('../services/emailService');

/**
 * Creates a new booking.
 * @type {import('express').RequestHandler}
 */
async function createBooking(req, res, next) {
  // ── REGISTRATION PORTAL CLOSED ──────────────────────────────────────────
  return res.status(409).json({
    error: 'Registrations for Isibuwa Festival 2026 are now closed. No new bookings are being accepted.',
  });

  // req.file is populated by uploadSlip middleware (Cloudinary)
  if (!req.file) {
    return res.status(400).json({ error: 'Payment slip is required' });
  }

  const paymentSlipUrl = req.file.path; // Cloudinary secure URL

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Advisory lock to prevent race conditions on capacity check ─────────
    // pg_try_advisory_xact_lock acquires a transaction-level advisory lock.
    // Any concurrent transaction trying the same lock will wait, ensuring
    // the count and insert are atomic.
    await client.query('SELECT pg_advisory_xact_lock(12345)');

    // ── Fetch event details & capacity ───────────────────────────────────
    const eventResult = await client.query('SELECT id, title, capacity FROM events LIMIT 1');
    const eventId       = eventResult.rows[0]?.id       || null;
    const eventTitle    = eventResult.rows[0]?.title    || 'Isibuwa Festival 2026';
    let eventCapacity   = parseInt(eventResult.rows[0]?.capacity || 200, 10);
    if (isNaN(eventCapacity) || eventCapacity < 200) {
      eventCapacity = 200;
      client.query('UPDATE events SET capacity = 200 WHERE capacity < 200 OR capacity IS NULL').catch(() => {});
    }

    // ── Capacity check: count non-rejected bookings ────────────────────────
    const countResult = await client.query(
      "SELECT COUNT(*) AS total FROM bookings WHERE status != 'rejected'"
    );
    const currentCount = parseInt(countResult.rows[0].total, 10);

    if (currentCount >= eventCapacity) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Event is fully booked. No more spots are available.' });
    }

    // ── Insert booking row ─────────────────────────────────────────────────
    const insertResult = await client.query(
      `INSERT INTO bookings (event_id, name, email, phone, district, payment_reference, payment_slip_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING id, name, email`,
      [eventId, name, email, phone, district, payment_reference, paymentSlipUrl]
    );

    await client.query('COMMIT');

    const newBooking = insertResult.rows[0];

    // ── Send confirmation email (non-blocking — don't fail the request) ────
    sendBookingConfirmation({ ...newBooking, event_title: eventTitle }).catch((err) => {
      console.error('Failed to send booking confirmation email:', err.message);
    });

    return res.status(201).json({
      message:   'Booking submitted successfully. You will receive a confirmation email shortly.',
      bookingId: newBooking.id,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

module.exports = { createBooking };
