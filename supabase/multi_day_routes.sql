-- Add multi-day support to routes
ALTER TABLE routes
ADD COLUMN IF NOT EXISTS is_multi_day BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS price_label TEXT DEFAULT 'per person'; -- e.g., "per person", "per person / day"

-- Add tour_end_date to bookings for multi-day bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS tour_end_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS num_days INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS pickup_location TEXT DEFAULT NULL;
