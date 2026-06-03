/**
 * scripts/seedAdmin.js — Admin user seeder
 *
 * Run once with: node scripts/seedAdmin.js
 * Requires .env to be configured with DATABASE_URL.
 *
 * Credentials:
 *   Email:    admin@yourevent.com
 *   Password: CHANGE_THIS_PASSWORD (change before going live!)
 *
 * Uses ON CONFLICT DO NOTHING — safe to re-run.
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const bcrypt = require('bcrypt');
const pool   = require('../src/config/db');

async function seed() {
  const email    = process.env.ADMIN_EMAIL    || 'admin@yourevent.com';
  const name     = process.env.ADMIN_NAME     || 'Event Admin';
  const password = process.env.ADMIN_PASSWORD || 'CHANGE_THIS_PASSWORD';

  if (password === 'CHANGE_THIS_PASSWORD') {
    console.warn('\n⚠️  WARNING: Using default password. Set ADMIN_PASSWORD in .env before deploying!\n');
  }

  // 12 salt rounds — strong security, ~300ms on a modern machine
  const hash = await bcrypt.hash(password, 12);

  await pool.query(
    'INSERT INTO admins (email, password_hash, name) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
    [email, hash, name]
  );

  console.log(`✅ Admin seeded: ${email}`);
  console.log('   You can now log in at /admin/login with the password from your .env file.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
