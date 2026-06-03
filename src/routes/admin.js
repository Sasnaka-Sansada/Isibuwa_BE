/**
 * routes/admin.js — Admin portal routes
 *
 * Login route is public (but rate limited).
 * All other routes require JWT auth middleware.
 */

'use strict';

const express   = require('express');
const rateLimit = require('express-rate-limit');
const auth      = require('../middleware/auth');
const { validate, adminLoginSchema } = require('../middleware/validate');
const {
  login,
  listBookings,
  getBooking,
  approveBooking,
  rejectBooking,
  getStats,
  logout,
} = require('../controllers/adminController');

const router = express.Router();

// 5 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      5,
  message:  { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// ── Public ───────────────────────────────────────────────────
router.post('/login',  loginLimiter, validate(adminLoginSchema), login);
router.post('/logout', logout);

// ── Protected (JWT required) ─────────────────────────────────
router.get('/stats',                  auth, getStats);
router.get('/bookings',               auth, listBookings);
router.get('/bookings/:id',           auth, getBooking);
router.patch('/bookings/:id/approve', auth, approveBooking);
router.patch('/bookings/:id/reject',  auth, rejectBooking);

module.exports = router;
