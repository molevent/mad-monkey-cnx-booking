-- Mad Monkey CNX Booking System - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum type for booking status
CREATE TYPE booking_status AS ENUM (
  'PENDING_REVIEW',
  'AWAITING_PAYMENT',
  'PAYMENT_UPLOADED',
  'CONFIRMED',
  'CANCELLED'
);

-- Create enum type for difficulty
CREATE TYPE route_difficulty AS ENUM (
  'Easy',
  'Medium',
  'Hard'
);

-- ============================================
-- Table: routes
-- Stores all eBike tour routes/packages
-- ============================================
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  difficulty route_difficulty DEFAULT 'Medium',
  duration TEXT, -- e.g., "4 hours", "Half Day"
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  cover_image_url TEXT,
  komoot_iframe TEXT, -- Full HTML <iframe> code from Komoot
  is_active BOOLEAN DEFAULT true
);

-- Create index on slug for faster lookups
CREATE INDEX idx_routes_slug ON routes(slug);
CREATE INDEX idx_routes_is_active ON routes(is_active);

-- ============================================
-- Table: bookings
-- Stores all customer booking requests
-- ============================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Tour Details
  tour_date DATE NOT NULL,
  start_time TIME NOT NULL,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
  
  -- Customer Contact Info
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_whatsapp TEXT,
  
  -- Participants
  pax_count INTEGER NOT NULL DEFAULT 1,
  participants_info JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Structure: [{ name: "John", height: "180cm", helmet_size: "L", dietary: "None" }, ...]
  
  -- Booking Status
  status booking_status DEFAULT 'PENDING_REVIEW',
  admin_notes TEXT,
  
  -- Payment & Waiver
  payment_slip_url TEXT,
  waiver_signature_url TEXT, -- Image of the signature
  waiver_pdf_url TEXT, -- Generated PDF stored in Supabase
  
  -- Tracking
  tracking_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex')
);

-- Create indexes for common queries
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_tour_date ON bookings(tour_date);
CREATE INDEX idx_bookings_route_id ON bookings(route_id);
CREATE INDEX idx_bookings_tracking_token ON bookings(tracking_token);
CREATE INDEX idx_bookings_customer_email ON bookings(customer_email);

-- ============================================
-- Function: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to routes table
CREATE TRIGGER update_routes_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to bookings table
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on tables
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Routes: Public can read active routes
CREATE POLICY "Public can read active routes"
  ON routes FOR SELECT
  USING (is_active = true);

-- Routes: Authenticated admins can do everything
CREATE POLICY "Admins can manage routes"
  ON routes FOR ALL
  USING (auth.role() = 'authenticated');

-- Bookings: Users can read their own booking via tracking token (handled in app)
-- For security, we use service role key for booking operations

-- Bookings: Authenticated admins can do everything
CREATE POLICY "Admins can manage bookings"
  ON bookings FOR ALL
  USING (auth.role() = 'authenticated');

-- Bookings: Allow insert for anonymous users (new booking)
CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (true);

-- Bookings: Allow update for anonymous users on their own booking (via tracking token)
CREATE POLICY "Users can update own booking via token"
  ON bookings FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Bookings: Allow select for anyone (controlled by tracking token in app)
CREATE POLICY "Anyone can read bookings"
  ON bookings FOR SELECT
  USING (true);

-- ============================================
-- Storage Buckets (run in Supabase Dashboard)
-- ============================================
-- Note: Create these buckets manually in Supabase Dashboard:
-- 1. route-images (public)
-- 2. payment-slips (private)
-- 3. waiver-signatures (private)
-- 4. waiver-pdfs (private)

-- Or use these SQL commands:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('route-images', 'route-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-slips', 'payment-slips', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('waiver-signatures', 'waiver-signatures', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('waiver-pdfs', 'waiver-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for route-images (public read)
CREATE POLICY "Public read route images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'route-images');

CREATE POLICY "Admins can upload route images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'route-images' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can update route images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'route-images' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can delete route images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'route-images' AND auth.role() = 'authenticated');

-- Storage Policies for payment-slips (customers upload, admins view)
CREATE POLICY "Anyone can upload payment slips"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-slips');

CREATE POLICY "Admins can view payment slips"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-slips' AND auth.role() = 'authenticated');

-- Storage Policies for waiver-signatures
CREATE POLICY "Anyone can upload waiver signatures"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'waiver-signatures');

CREATE POLICY "Admins can view waiver signatures"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'waiver-signatures' AND auth.role() = 'authenticated');

-- Storage Policies for waiver-pdfs
CREATE POLICY "Anyone can upload waiver pdfs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'waiver-pdfs');

CREATE POLICY "Admins can view waiver pdfs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'waiver-pdfs' AND auth.role() = 'authenticated');
