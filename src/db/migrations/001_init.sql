-- ============================================================
--  001_init.sql — Isibuwa Music Event Booking Database Schema
--  Run this in Supabase SQL editor before starting the backend.
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Events ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT,
  date          TIMESTAMPTZ NOT NULL,
  venue         TEXT NOT NULL,
  capacity      INTEGER NOT NULL DEFAULT 150,
  ticket_price  NUMERIC(10, 2),                 -- nullable = free event
  artists       JSONB DEFAULT '[]'::JSONB,       -- array of artist objects
  moderators    JSONB DEFAULT '[]'::JSONB,
  vocalists     JSONB DEFAULT '[]'::JSONB,
  instrumentalists JSONB DEFAULT '[]'::JSONB,
  reviewers     JSONB DEFAULT '[]'::JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Bookings ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id               SERIAL PRIMARY KEY,
  event_id         INTEGER REFERENCES events(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT NOT NULL,
  district         TEXT,
  payment_reference TEXT,
  payment_slip_url TEXT NOT NULL,                -- Cloudinary URL
  status           booking_status DEFAULT 'pending',
  submitted_at     TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at      TIMESTAMPTZ
);

-- Index for fast status filtering and capacity count
CREATE INDEX IF NOT EXISTS idx_bookings_status    ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_email     ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_event_id  ON bookings(event_id);

-- ── Tickets ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
  id           SERIAL PRIMARY KEY,
  booking_id   INTEGER REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  ticket_code  TEXT UNIQUE NOT NULL,             -- e.g. EVT-2026-A3F7
  issued_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_code ON tickets(ticket_code);

-- ── Admins ───────────────────────────────────────────────────
-- No public registration. Seed via scripts/seedAdmin.js
CREATE TABLE IF NOT EXISTS admins (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
