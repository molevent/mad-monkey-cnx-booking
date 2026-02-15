-- Activity Log for Bookings
-- Tracks all actions, changes, errors, and events
-- Run this in your Supabase SQL Editor

CREATE TABLE booking_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Who performed the action
  actor_type TEXT NOT NULL DEFAULT 'system', -- 'admin', 'customer', 'system'
  actor_email TEXT,
  
  -- What happened
  action TEXT NOT NULL, -- e.g. 'created', 'status_changed', 'deleted', 'error', etc.
  description TEXT NOT NULL,
  
  -- Optional structured data (old/new values, error details, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Severity level
  level TEXT NOT NULL DEFAULT 'info' -- 'info', 'warning', 'error', 'success'
);

CREATE INDEX idx_activity_log_booking_id ON booking_activity_log(booking_id);
CREATE INDEX idx_activity_log_created_at ON booking_activity_log(created_at DESC);
CREATE INDEX idx_activity_log_action ON booking_activity_log(action);

-- Enable RLS
ALTER TABLE booking_activity_log ENABLE ROW LEVEL SECURITY;

-- Admins can read all logs
CREATE POLICY "Admins can read activity logs"
  ON booking_activity_log FOR SELECT
  USING (auth.role() = 'authenticated');

-- Service role can insert logs (from server actions)
CREATE POLICY "Service can insert activity logs"
  ON booking_activity_log FOR INSERT
  WITH CHECK (true);

-- Allow delete cascade to work
CREATE POLICY "Allow delete on activity logs"
  ON booking_activity_log FOR DELETE
  USING (true);
