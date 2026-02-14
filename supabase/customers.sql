-- Customers table for returning customer tracking
-- Run this in Supabase SQL Editor

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  whatsapp TEXT,
  passport_no TEXT,
  nationality TEXT,
  notes TEXT,
  total_bookings INTEGER DEFAULT 0,
  last_booking_at TIMESTAMPTZ
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_full_name ON customers(full_name);

-- Add customer_id to bookings table (nullable for backward compat)
ALTER TABLE bookings ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Anyone can read customers by email (for booking form lookup)
CREATE POLICY "Anyone can read customers"
  ON customers FOR SELECT
  USING (true);

-- Anyone can create customers (from booking form)
CREATE POLICY "Anyone can create customers"
  ON customers FOR INSERT
  WITH CHECK (true);

-- Anyone can update customers (from booking form)
CREATE POLICY "Anyone can update customers"
  ON customers FOR UPDATE
  USING (true);

-- Admins can delete customers
CREATE POLICY "Admins can delete customers"
  ON customers FOR DELETE
  USING (auth.role() = 'authenticated');

-- Trigger to update updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
