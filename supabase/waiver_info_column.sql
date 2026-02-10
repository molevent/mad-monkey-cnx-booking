-- Add waiver_info JSONB column to bookings table
-- Run this in your Supabase SQL Editor

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS waiver_info JSONB DEFAULT NULL;

-- Structure: { "signer_name": "John Doe", "passport_no": "AB1234567", "date": "2026-02-10", "email": "john@example.com" }
