/**
 * routes/bookings.js — Public booking submission route
 *
 * Rate limited: 5 requests per 15 minutes per IP.
 * Middleware chain: rateLimiter → uploadSlip → validate(bookingSchema) → createBooking
 */

'use strict';

const express      = require('express');
const rateLimit    = require('express-rate-limit');
const { uploadSlip }                    = require('../middleware/upload');
const { validate, bookingSchema }       = require('../middleware/validate');
const { createBooking }                 = require('../controllers/bookingController');

const router = express.Router();

// 5 submissions per 15 minutes per IP
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      5,
  message:  { error: 'Too many booking attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

/**
 * POST /api/bookings
 */
router.post('/', bookingLimiter, uploadSlip, validate(bookingSchema), createBooking);

module.exports = router;
