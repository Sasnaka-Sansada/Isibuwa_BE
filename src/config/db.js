/**
 * config/db.js — PostgreSQL connection pool
 *
 * Uses pg.Pool with DATABASE_URL from environment variables.
 * All queries use parameterized statements ($1, $2, ...) to prevent SQL injection.
 */

'use strict';

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase requires SSL in production; allow self-signed certs on free tier
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,               // max connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    return;
  }
  console.log('✅ Database connected');
  release();
});

// Propagate pool errors to console so the process doesn't crash silently
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

module.exports = pool;
