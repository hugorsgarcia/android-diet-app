-- =============================================
-- Migração Firebase → Supabase: Schema Inicial
-- =============================================

-- Tabela: diets (substitui users/{uid}/diets/{id})
CREATE TABLE IF NOT EXISTS diets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight TEXT NOT NULL,
  height TEXT NOT NULL,
  age TEXT NOT NULL,
  gender TEXT NOT NULL,
  objective TEXT NOT NULL,
  level TEXT NOT NULL,
  diet_type TEXT DEFAULT 'padrao',
  diet_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days')
);

CREATE INDEX idx_diets_user_id ON diets(user_id);
CREATE INDEX idx_diets_created_at ON diets(user_id, created_at DESC);
CREATE INDEX idx_diets_expires_at ON diets(expires_at);

ALTER TABLE diets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own diets" ON diets
  FOR ALL USING (auth.uid() = user_id);

-- Tabela: water_tracking (substitui users/{uid}/water/{date})
CREATE TABLE IF NOT EXISTS water_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  glasses INTEGER NOT NULL DEFAULT 0,
  goal INTEGER NOT NULL DEFAULT 8,
  UNIQUE(user_id, date)
);

ALTER TABLE water_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own water" ON water_tracking
  FOR ALL USING (auth.uid() = user_id);

-- Tabela: streaks (substitui users/{uid}/streaks/current)
CREATE TABLE IF NOT EXISTS streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date TEXT NOT NULL DEFAULT ''
);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own streaks" ON streaks
  FOR ALL USING (auth.uid() = user_id);

-- Tabela: weight_entries (substitui users/{uid}/weight/{id})
CREATE TABLE IF NOT EXISTS weight_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value REAL NOT NULL,
  date TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_weight_user_date ON weight_entries(user_id, date ASC);

ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own weight" ON weight_entries
  FOR ALL USING (auth.uid() = user_id);

-- Tabela: weight_goals (substitui users/{uid}.weightGoal)
CREATE TABLE IF NOT EXISTS weight_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  goal REAL NOT NULL DEFAULT 0
);

ALTER TABLE weight_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own weight goal" ON weight_goals
  FOR ALL USING (auth.uid() = user_id);

-- Tabela: diary_entries (substitui users/{uid}/diary/{date})
CREATE TABLE IF NOT EXISTS diary_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  entries JSONB NOT NULL DEFAULT '[]'::jsonb,
  daily_goal INTEGER NOT NULL DEFAULT 2000,
  UNIQUE(user_id, date)
);

ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own diary" ON diary_entries
  FOR ALL USING (auth.uid() = user_id);

-- Tabela: fasting_sessions (substitui users/{uid}/fasting/current)
CREATE TABLE IF NOT EXISTS fasting_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  is_fasting BOOLEAN NOT NULL DEFAULT false,
  current_plan TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  history JSONB NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE fasting_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own fasting" ON fasting_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Tabela: meal_checkins (substitui diets/{id}.checkins)
CREATE TABLE IF NOT EXISTS meal_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diet_id UUID NOT NULL REFERENCES diets(id) ON DELETE CASCADE,
  checkins JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(user_id, diet_id)
);

ALTER TABLE meal_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own checkins" ON meal_checkins
  FOR ALL USING (auth.uid() = user_id);

-- Tabela: rate_limits (substitui rateLimits/{key})
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  function_name TEXT NOT NULL,
  call_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, function_name)
);

CREATE INDEX idx_rate_limits_window ON rate_limits(window_start);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
-- Rate limits são gerenciados pelas Edge Functions (service_role)
CREATE POLICY "Service role manages rate limits" ON rate_limits
  FOR ALL USING (true);
