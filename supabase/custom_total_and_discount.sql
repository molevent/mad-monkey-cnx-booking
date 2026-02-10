-- Add custom_total to bookings (admin can override the calculated total)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS custom_total NUMERIC(10, 2) DEFAULT NULL;

-- Add group discount fields to routes
ALTER TABLE routes
ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'none' CHECK (discount_type IN ('none', 'fixed', 'percentage')),
ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_from_pax INTEGER DEFAULT 2;

-- Payment tracking columns
-- payment_option: 'deposit_50' = pay 50% now + 50% later, 'full_100' = pay 100% now, 'pay_at_venue' = pay everything on-site
-- payment_status: 'unpaid', 'deposit_paid', 'fully_paid'
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_option TEXT DEFAULT NULL CHECK (payment_option IN ('deposit_50', 'full_100', 'pay_at_venue')),
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'deposit_paid', 'fully_paid')),
ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10, 2) DEFAULT 0;

-- Check-in tracking
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ DEFAULT NULL;
