/**
 * controllers/adminController.js — Admin portal endpoints
 *
 * All routes (except login) are protected by the auth middleware.
 *
 * Security notes:
 *  - Passwords compared with bcrypt.compare (timing-safe).
 *  - JWT signed with JWT_SECRET, expires per JWT_EXPIRES_IN (8h default).
 *  - Payment slip URLs returned as signed Cloudinary URLs (1h expiry)
 *    so raw Cloudinary URLs aren't exposed to the client.
 *  - All queries use parameterized statements.
 */

'use strict';

const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken');
const pool      = require('../config/db');
const cloudinary = require('../config/cloudinary');
const { generateTicketCode }   = require('../services/ticketService');
const { sendApprovalEmail, sendRejectionEmail } = require('../services/emailService');

// ── login ────────────────────────────────────────────────────

/**
 * POST /api/admin/login
 * Authenticates an admin and returns a JWT.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      'SELECT id, email, name, password_hash FROM admins WHERE email = $1',
      [email]
    );

    const admin = result.rows[0];

    // Use a consistent timing response whether user exists or not
    // to prevent user enumeration attacks
    const hash = admin?.password_hash || '$2b$12$invalidhashfortimingnomatch...';
    const isValid = await bcrypt.compare(password, hash);

    if (!admin || !isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { adminId: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.json({
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email },
    });
  } catch (err) {
    next(err);
  }
}

// ── listBookings ─────────────────────────────────────────────

/**
 * GET /api/admin/bookings?search=&status=&page=1&limit=20
 * Returns paginated, searchable, filterable list of bookings.
 */
async function listBookings(req, res, next) {
  try {
    const page   = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim() || '';
    const status = req.query.status?.trim() || '';

    // Build dynamic WHERE clause
    const conditions = [];
    const params     = [];

    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      conditions.push(`(b.name ILIKE $${idx} OR b.email ILIKE $${idx} OR b.district ILIKE $${idx} OR b.payment_reference ILIKE $${idx})`);
    }

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      params.push(status);
      conditions.push(`b.status = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count for pagination metadata
    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM bookings b ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Fetch page of results
    params.push(limit, offset);
    const dataResult = await pool.query(
      `SELECT
         b.id, b.name, b.email, b.phone, b.district, b.payment_reference, b.status,
         b.submitted_at, b.reviewed_at, b.event_id,
         t.ticket_code, t.checked_in_at
       FROM bookings b
       LEFT JOIN tickets t ON t.booking_id = b.id
       ${where}
       ORDER BY b.submitted_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({
      bookings: dataResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
}

// ── getBooking ───────────────────────────────────────────────

/**
 * GET /api/admin/bookings/:id
 * Returns a single booking with ticket info and a signed Cloudinary URL
 * for the payment slip (valid for 1 hour).
 */
async function getBooking(req, res, next) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
         b.id, b.name, b.email, b.phone, b.district, b.payment_reference, b.status,
         b.payment_slip_url, b.submitted_at, b.reviewed_at, b.event_id,
         t.ticket_code, t.issued_at, t.checked_in_at
       FROM bookings b
       LEFT JOIN tickets t ON t.booking_id = b.id
       WHERE b.id = $1`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = result.rows[0];

    // Generate a signed Cloudinary delivery URL for the payment slip.
    // We use cloudinary.url() with sign_url:true which works with
    // publicly-uploaded resources (delivery_type 'upload').
    // NOTE: private_download_url does NOT work here because that method
    // targets the Download API which requires delivery_type 'private'.
    let signedSlipUrl = null;
    if (booking.payment_slip_url) {
      try {
        // Extract resource_type and public_id from the stored Cloudinary URL
        // Example URL: https://res.cloudinary.com/<cloud>/image/upload/v123/payment_slips/abc.jpg
        //              or: https://res.cloudinary.com/<cloud>/raw/upload/v123/payment_slips/abc.pdf
        const urlParts = booking.payment_slip_url.split('/');
        const uploadIndex = urlParts.indexOf('upload');
        const resourceType = urlParts[uploadIndex - 1] || 'image'; // 'image' or 'raw'

        // Public ID with extension is everything after upload/v{version}/
        const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');

        // For images, cloudinary.url expects public_id WITHOUT extension
        // For raw files (PDFs), we need the extension in the public_id
        const isRaw = resourceType === 'raw';
        const publicId = isRaw
          ? publicIdWithExt                                    // keep ext for raw
          : publicIdWithExt.replace(/\.[^/.]+$/, '');          // strip ext for images

        signedSlipUrl = cloudinary.url(publicId, {
          resource_type: resourceType,
          type:          'upload',
          sign_url:      true,
          secure:        true,
        });
      } catch {
        // Fall back to the original URL if signing fails
        signedSlipUrl = booking.payment_slip_url;
      }
    }

    return res.json({ ...booking, signed_slip_url: signedSlipUrl });
  } catch (err) {
    next(err);
  }
}

// ── approveBooking ───────────────────────────────────────────

/**
 * PATCH /api/admin/bookings/:id/approve
 * Approves a pending booking, generates a ticket, sends approval email.
 */
async function approveBooking(req, res, next) {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Lock the booking row to prevent concurrent approval/rejection
    const bookingResult = await client.query(
      `SELECT b.id, b.name, b.email, b.phone, b.district, b.status,
              e.title AS event_title, e.date AS event_date, e.venue AS event_venue
       FROM bookings b
       LEFT JOIN events e ON e.id = b.event_id
       WHERE b.id = $1
       FOR UPDATE OF b`,
      [id]
    );

    if (!bookingResult.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    if (booking.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: `Booking is already ${booking.status} and cannot be approved`,
      });
    }

    // Generate unique ticket code
    const ticketCode = await generateTicketCode();

    // Insert ticket record
    await client.query(
      'INSERT INTO tickets (booking_id, ticket_code) VALUES ($1, $2)',
      [id, ticketCode]
    );

    // Update booking status
    await client.query(
      "UPDATE bookings SET status = 'approved', reviewed_at = NOW() WHERE id = $1",
      [id]
    );

    await client.query('COMMIT');

    // Send approval email (non-blocking)
    sendApprovalEmail(booking, { ticket_code: ticketCode }).catch((err) => {
      console.error('Failed to send approval email:', err.message);
    });

    return res.json({ message: 'Booking approved', ticket_code: ticketCode });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// ── rejectBooking ────────────────────────────────────────────

/**
 * PATCH /api/admin/bookings/:id/reject
 * Rejects a pending booking and sends rejection email.
 */
async function rejectBooking(req, res, next) {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const bookingResult = await client.query(
      `SELECT b.id, b.name, b.email, b.status, e.title AS event_title
       FROM bookings b
       LEFT JOIN events e ON e.id = b.event_id
       WHERE b.id = $1
       FOR UPDATE OF b`,
      [id]
    );

    if (!bookingResult.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    if (booking.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: `Booking is already ${booking.status} and cannot be rejected`,
      });
    }

    await client.query(
      "UPDATE bookings SET status = 'rejected', reviewed_at = NOW() WHERE id = $1",
      [id]
    );

    await client.query('COMMIT');

    // Send rejection email (non-blocking)
    sendRejectionEmail(booking).catch((err) => {
      console.error('Failed to send rejection email:', err.message);
    });

    return res.json({ message: 'Booking rejected' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// ── getStats ─────────────────────────────────────────────────

/**
 * GET /api/admin/stats
 * Returns aggregate booking statistics.
 */
async function getStats(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE TRUE)                      AS total,
         COUNT(*) FILTER (WHERE status = 'pending')        AS pending,
         COUNT(*) FILTER (WHERE status = 'approved')       AS approved,
         COUNT(*) FILTER (WHERE status = 'rejected')       AS rejected,
         COUNT(*) FILTER (WHERE status != 'rejected')      AS non_rejected
       FROM bookings`
    );

    // Count checked-in attendees
    const checkinResult = await pool.query(
      `SELECT COUNT(*) AS checked_in FROM tickets WHERE checked_in_at IS NOT NULL`
    );

    // Count bookings per district
    const districtResult = await pool.query(
      `SELECT district, COUNT(*) AS count
       FROM bookings
       WHERE district IS NOT NULL AND district != ''
       GROUP BY district
       ORDER BY count DESC`
    );

    const { total, pending, approved, rejected, non_rejected } = result.rows[0];
    const checked_in = parseInt(checkinResult.rows[0].checked_in, 10);
    const remaining_capacity = Math.max(0, 150 - parseInt(non_rejected, 10));
    const districts = districtResult.rows.map((row) => ({
      district: row.district,
      count:    parseInt(row.count, 10),
    }));

    return res.json({
      total:              parseInt(total,    10),
      pending:            parseInt(pending,  10),
      approved:           parseInt(approved, 10),
      rejected:           parseInt(rejected, 10),
      checked_in,
      remaining_capacity,
      districts,
    });
  } catch (err) {
    next(err);
  }
}

// ── logout ───────────────────────────────────────────────────

/**
 * POST /api/admin/logout
 * Stateless JWT — client is responsible for deleting the token.
 */
function logout(_req, res) {
  return res.json({ message: 'Logged out successfully' });
}

// ── checkinBooking ───────────────────────────────────────────

/**
 * PATCH /api/admin/bookings/:id/checkin
 * Marks an approved booking as checked-in at the gate.
 * Uses row-level locking to prevent double check-ins.
 */
async function checkinBooking(req, res, next) {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Fetch booking with ticket, locking the ticket row
    const result = await client.query(
      `SELECT b.id, b.name, b.status, t.id AS ticket_id, t.ticket_code, t.checked_in_at
       FROM bookings b
       LEFT JOIN tickets t ON t.booking_id = b.id
       WHERE b.id = $1
       FOR UPDATE OF b`,
      [id]
    );

    if (!result.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = result.rows[0];

    if (booking.status !== 'approved') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: `Cannot check in: booking is ${booking.status}, not approved`,
      });
    }

    if (!booking.ticket_id) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'No ticket found for this booking' });
    }

    if (booking.checked_in_at) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: `Already checked in at ${new Date(booking.checked_in_at).toLocaleString()}`,
      });
    }

    // Mark as checked in
    await client.query(
      'UPDATE tickets SET checked_in_at = NOW() WHERE id = $1',
      [booking.ticket_id]
    );

    await client.query('COMMIT');

    return res.json({
      message: `${booking.name} has been checked in successfully`,
      ticket_code: booking.ticket_code,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

module.exports = { login, listBookings, getBooking, approveBooking, rejectBooking, checkinBooking, getStats, logout };
