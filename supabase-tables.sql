-- Follows table (if not exists)
CREATE TABLE IF NOT EXISTS follows (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  notify_new_incidents BOOLEAN DEFAULT TRUE,
  notify_risk_increase BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- Alerts table (if not exists)
CREATE TABLE IF NOT EXISTS alerts (
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
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies (use user_id::text for comparison with auth.uid())
DROP POLICY IF EXISTS "Users can manage own follows" ON follows;
DROP POLICY IF EXISTS "Users can view own alerts" ON alerts;
DROP POLICY IF EXISTS "Users can update own alerts" ON alerts;
DROP POLICY IF EXISTS "Users can insert own alerts" ON alerts;

CREATE POLICY "Users can manage own follows" ON follows FOR ALL USING (user_id = auth.uid()::TEXT);
CREATE POLICY "Users can view own alerts" ON alerts FOR SELECT USING (user_id = auth.uid()::TEXT);
CREATE POLICY "Users can update own alerts" ON alerts FOR UPDATE USING (user_id = auth.uid()::TEXT);
CREATE POLICY "Users can insert own alerts" ON alerts FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);
