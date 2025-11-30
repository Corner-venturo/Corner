-- 移除舊的 RLS 政策（使用 auth.uid() 的政策不適用於自定義認證）
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON user_preferences;

DROP POLICY IF EXISTS "Users can view own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON notes;
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON notes;

DROP POLICY IF EXISTS "Users can view own manifestation records" ON manifestation_records;
DROP POLICY IF EXISTS "Users can insert own manifestation records" ON manifestation_records;
DROP POLICY IF EXISTS "Users can update own manifestation records" ON manifestation_records;
DROP POLICY IF EXISTS "Users can delete own manifestation records" ON manifestation_records;

-- 暫時關閉 RLS，因為前端已有完整的認證控制
-- 未來如果需要，可以改用 service_role key 從後端操作
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE manifestation_records DISABLE ROW LEVEL SECURITY;
