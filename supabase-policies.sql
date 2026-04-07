-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can manage own follows" ON follows;
DROP POLICY IF EXISTS "Users can view own alerts" ON alerts;
DROP POLICY IF EXISTS "Users can update own alerts" ON alerts;
DROP POLICY IF EXISTS "Users can insert own alerts" ON alerts;

-- Allow authenticated users to do everything (for development)
-- In production, you'd want more restrictive policies
CREATE POLICY "users_all" ON users FOR ALL USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (true);

CREATE POLICY "follows_all" ON follows FOR ALL USING (true);
CREATE POLICY "alerts_all" ON alerts FOR ALL USING (true);
CREATE POLICY "alerts_insert" ON alerts FOR INSERT WITH CHECK (true);
