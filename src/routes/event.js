/**
 * routes/event.js — Public event info endpoint
 */

'use strict';

const express = require('express');
const pool    = require('../config/db');

const router = express.Router();

/**
 * GET /api/event
 * Returns the current event with calculated remaining capacity.
 */
router.get('/', async (req, res, next) => {
  try {
    const eventResult = await pool.query(
      'SELECT id, title, description, date, venue, capacity, ticket_price, artists, moderators, vocalists, instrumentalists, reviewers FROM events LIMIT 1'
    );

    if (!eventResult.rows[0]) {
      return res.status(404).json({ error: 'No event found' });
    }

    const event = eventResult.rows[0];

    // Calculate remaining spots
    const capacityResult = await pool.query(
      "SELECT COUNT(*) AS used FROM bookings WHERE status != 'rejected'"
    );
    const used      = parseInt(capacityResult.rows[0].used, 10);
    const remaining = Math.max(0, event.capacity - used);

    return res.json({ ...event, remaining_capacity: remaining });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
