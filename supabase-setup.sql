-- Drop existing tables and recreate with correct schema
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table with camelCase to snake_case columns
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  email_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notification_preferences JSONB DEFAULT '{"email":true,"push":false,"severityThreshold":"Medium","alertNewIncidents":true,"alertRiskIncrease":true}',
  fcm_token TEXT,
  subscription_tier TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  max_company_follows INT DEFAULT 3,
  hibp_checks_remaining INT DEFAULT 1
);

-- Follows table
CREATE TABLE follows (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  notify_new_incidents BOOLEAN DEFAULT TRUE,
  notify_risk_increase BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- Alerts table
CREATE TABLE alerts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  incident_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'Medium',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies - allow all for now (for development)
CREATE POLICY "users_all" ON users FOR ALL USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "follows_all" ON follows FOR ALL USING (true);
CREATE POLICY "alerts_all" ON alerts FOR ALL USING (true);
CREATE POLICY "alerts_insert" ON alerts FOR INSERT WITH CHECK (true);
