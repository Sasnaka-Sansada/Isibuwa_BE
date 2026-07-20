/**
 * scripts/updateCapacity200.js
 * Updates the capacity column in the events table to 200.
 */

'use strict';

const pool = require('../src/config/db');

async function run() {
  try {
    console.log('Updating event capacity to 200...');
    const result = await pool.query(
      `UPDATE events SET capacity = 200 WHERE id = 1 RETURNING id, title, capacity;`
    );
    if (result.rowCount > 0) {
      console.log('✅ Updated event capacity:', result.rows[0]);
    } else {
      console.warn('⚠️ No event with id = 1 found to update.');
    }
  } catch (err) {
    console.error('❌ Failed to update capacity:', err.message);
  } finally {
    await pool.end();
  }
}

run();
