-- 建立使用者偏好設定表
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  preference_key TEXT NOT NULL,
  preference_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, preference_key)
);

-- 建立便條紙表
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  tab_id TEXT NOT NULL,
  tab_name TEXT NOT NULL DEFAULT '筆記',
  content TEXT NOT NULL DEFAULT '',
  tab_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tab_id)
);

-- 建立顯化魔法記錄表
CREATE TABLE IF NOT EXISTS manifestation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, record_date)
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_manifestation_records_user_id ON manifestation_records(user_id);
CREATE INDEX IF NOT EXISTS idx_manifestation_records_date ON manifestation_records(record_date);

-- 啟用 RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifestation_records ENABLE ROW LEVEL SECURITY;

-- RLS 政策：使用者只能存取自己的資料
-- 注意：這些政策已由後續 migration 移除，因為系統使用自定義認證而非 Supabase Auth
-- 保留此段以維持 migration 歷史完整性
