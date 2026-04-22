-- Booking & scheduling (online meetings / calls)
-- Requires PostgreSQL 13+ (gen_random_uuid). Apply with psql or your host’s SQL console.

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booked_on DATE NOT NULL,
  start_hm TEXT NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 45,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  company TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  ics_uid TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT bookings_status_chk CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  CONSTRAINT bookings_unique_slot UNIQUE (booked_on, start_hm)
);

CREATE INDEX IF NOT EXISTS idx_bookings_booked_on ON bookings (booked_on);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_email ON bookings (guest_email);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);
