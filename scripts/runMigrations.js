'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../src/db/migrations');
  const migrationFiles = ['001_init.sql', '002_seed_event.sql', '003_add_checkin.sql'];

  console.log('🏁 Starting database migrations...');

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    console.log(`📁 Reading migration file: ${file}`);
    const sql = fs.readFileSync(filePath, 'utf8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      console.log(`⏳ Executing ${file}...`);
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`✅ Completed: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`❌ Migration failed for ${file}:`, err.message);
      process.exit(1);
    } finally {
      client.release();
    }
  }

  console.log('🎉 All database migrations ran successfully!');
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('Migration runner crashed:', err.message);
  process.exit(1);
});
