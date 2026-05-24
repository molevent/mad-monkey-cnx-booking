-- Admin / Staff notification settings — run in Supabase SQL Editor
-- Adds new keys to existing email_settings table for staff notifications
-- when a new booking comes in (email + optional WhatsApp).

INSERT INTO email_settings (key, value) VALUES
  -- Comma-separated list of staff emails to notify on new booking
  ('notification_emails', ''),
  -- Whether to send staff notifications at all
  ('notify_on_new_booking', 'true'),
  -- WhatsApp via CallMeBot (https://www.callmebot.com/blog/free-api-whatsapp-messages/)
  -- Set phone (international format, no '+' or spaces, e.g. 66812345678) and the apikey
  -- you received after messaging the bot. Leave empty to disable.
  ('whatsapp_callmebot_phone', ''),
  ('whatsapp_callmebot_apikey', ''),
  -- Generic webhook URL (POST JSON). Useful for Zapier / Make.com / n8n / WAHA
  -- that forwards to a WhatsApp group. Leave empty to disable.
  ('whatsapp_webhook_url', '')
ON CONFLICT (key) DO NOTHING;
