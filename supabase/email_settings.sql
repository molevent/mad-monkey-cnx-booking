-- Email Settings table for admin-configurable email content
-- Run this in Supabase SQL Editor

CREATE TABLE email_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read
CREATE POLICY "Authenticated can read email settings"
  ON email_settings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Authenticated users can update
CREATE POLICY "Authenticated can update email settings"
  ON email_settings FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Authenticated users can insert
CREATE POLICY "Authenticated can insert email settings"
  ON email_settings FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Anyone can read (needed for server actions to read settings when sending emails)
CREATE POLICY "Service role can read email settings"
  ON email_settings FOR SELECT
  USING (true);

-- Seed default values
INSERT INTO email_settings (key, value) VALUES
  ('company_name', 'Mad Monkey eBike Tours'),
  ('company_address', 'Chiang Mai, Thailand'),
  ('company_phone', ''),
  ('company_whatsapp', ''),
  ('company_email', 'booking@madmonkeycnx.com'),
  ('bank_name', 'Siam Commercial Bank (SCB)'),
  ('bank_account_name', 'Nuthawut Tharatjai'),
  ('bank_account_number', '406-7-61675-7'),
  ('bank_swift_code', 'SICOQHBK'),
  ('meeting_point', 'Mad Monkey eBike HQ, 123 Cycling Lane, Chiang Mai'),
  ('meeting_point_map_url', 'https://maps.app.goo.gl/aE7fjFfVLoZMDaau9'),
  ('what_to_bring', 'Comfortable clothes suitable for cycling
Sunscreen and sunglasses
Valid ID/Passport
Camera for amazing photos!'),
  ('acknowledgement_subject', 'Booking Request Received - Mad Monkey eBike Tours'),
  ('acknowledgement_heading', 'Thank you, {{customer_name}}!'),
  ('acknowledgement_body', 'We''ve received your booking request and our team is reviewing it. You''ll hear from us within 24 hours.'),
  ('payment_subject', 'Payment Required - Mad Monkey eBike Tours'),
  ('payment_heading', 'Great news, {{customer_name}}!'),
  ('payment_body', 'Your booking has been approved! To confirm your spot, please complete the payment and sign the liability waiver.'),
  ('payment_deadline', '24 hours'),
  ('confirmation_subject', 'Booking Confirmed! - Mad Monkey eBike Tours'),
  ('confirmation_heading', 'See you soon, {{customer_name}}!'),
  ('confirmation_body', 'Your booking is now fully confirmed. We can''t wait to show you the beautiful trails of Chiang Mai!');
