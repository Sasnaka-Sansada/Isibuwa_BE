/**
 * app.js — Isibuwa Backend API Entry Point
 *
 * Express application setup:
 *  - helmet()  : Sets security-focused HTTP headers
 *  - cors()    : Restricts requests to FRONTEND_URL in production
 *  - json()    : Parses JSON request bodies
 *  - Routes    : /api/event, /api/bookings, /api/admin
 *  - Error handler: Returns JSON error responses (no stack traces in prod)
 */

'use strict';

require('dotenv').config();

const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');

// Route modules
const eventRouter    = require('./routes/event');
const bookingsRouter = require('./routes/bookings');
const adminRouter    = require('./routes/admin');

const app = express();

// Trust reverse proxy (like Render) to correctly resolve client IP for rate limiting
app.set('trust proxy', 1);

// ── Security headers ─────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────
// Restrict to FRONTEND_URL in production. In dev, allows localhost:5173.
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods:     ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Limit JSON body size

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ───────────────────────────────────────────────
app.use('/api/event',    eventRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/admin',    adminRouter);

// ── 404 handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────
// IMPORTANT: Must have exactly 4 parameters for Express to recognize it as
// an error-handling middleware.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // Log full error server-side for debugging
  console.error('[ERROR]', err.message, process.env.NODE_ENV !== 'production' ? err.stack : '');

  const status = err.status || err.statusCode || 500;

  // Never expose stack traces to the client in production
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'An internal server error occurred'
      : err.message || 'An unexpected error occurred';

  res.status(status).json({ error: message });
});

// ── Server start ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Isibuwa API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = app; // Trigger nodemon restart
