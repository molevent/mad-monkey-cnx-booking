-- Admin Users table for approval flow
-- Run this in Supabase SQL Editor

CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  is_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_users_auth_id ON admin_users(auth_id);
CREATE INDEX idx_admin_users_email ON admin_users(email);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (for signup)
CREATE POLICY "Anyone can create admin user profile"
  ON admin_users FOR INSERT
  WITH CHECK (true);

-- Authenticated users can read all admin users
CREATE POLICY "Authenticated can read admin users"
  ON admin_users FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only super admins can update (approve/reject)
CREATE POLICY "Authenticated can update admin users"
  ON admin_users FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Seed: Make the first user a super admin
-- Replace the email below with your admin email
INSERT INTO admin_users (auth_id, email, full_name, is_approved, is_super_admin)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', email), true, true
FROM auth.users
LIMIT 1;
