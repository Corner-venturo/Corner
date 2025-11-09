-- Corner Fitness 資料庫表格
-- 建立時間：2025-11-09

BEGIN;

-- ========== 1. 訓練課表 (workout_sessions) ==========
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- 訓練資訊
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER, -- 訓練時長（分鐘）

  -- 訓練統計
  total_volume INTEGER DEFAULT 0, -- 總訓練容量 (kg)
  total_sets INTEGER DEFAULT 0, -- 總組數
  total_reps INTEGER DEFAULT 0, -- 總次數

  -- 備註
  notes TEXT,
  feeling INTEGER CHECK (feeling BETWEEN 1 AND 5), -- 訓練感受 1-5 星

  -- 時間戳記
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_workspace_id ON public.workout_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON public.workout_sessions(date);

-- 禁用 RLS（內部系統）
ALTER TABLE public.workout_sessions DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.workout_sessions IS '訓練課表 - 記錄每次訓練的基本資訊';
COMMENT ON COLUMN public.workout_sessions.total_volume IS '總訓練容量 = Σ(組數 × 重量 × 次數)';
COMMENT ON COLUMN public.workout_sessions.feeling IS '訓練感受評分 1-5 星';

-- ========== 2. 訓練組數明細 (workout_sets) ==========
CREATE TABLE IF NOT EXISTS public.workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,

  -- 動作資訊
  exercise_id INTEGER NOT NULL, -- 對應 exercises.ts 的 id
  exercise_name TEXT NOT NULL, -- 動作名稱（快取，避免每次查詢）
  exercise_category TEXT NOT NULL, -- 動作分類

  -- 組數資訊
  set_number INTEGER NOT NULL, -- 第幾組
  weight DECIMAL(6, 2), -- 重量 (kg)
  reps INTEGER, -- 次數
  duration_seconds INTEGER, -- 持續時間（秒，用於平板支撐等）
  distance_meters DECIMAL(8, 2), -- 距離（公尺，用於跑步等）

  -- 狀態
  completed BOOLEAN DEFAULT false, -- 是否完成
  rest_seconds INTEGER DEFAULT 90, -- 組間休息時間（秒）

  -- 備註
  notes TEXT,

  -- 時間戳記
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_workout_sets_session_id ON public.workout_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_id ON public.workout_sets(exercise_id);

-- 禁用 RLS（內部系統）
ALTER TABLE public.workout_sets DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.workout_sets IS '訓練組數明細 - 記錄每組訓練的詳細資料';
COMMENT ON COLUMN public.workout_sets.exercise_id IS '對應 exercises.ts 的動作 ID';
COMMENT ON COLUMN public.workout_sets.weight IS '重量（公斤）';
COMMENT ON COLUMN public.workout_sets.reps IS '次數';
COMMENT ON COLUMN public.workout_sets.duration_seconds IS '持續時間（秒）- 用於平板支撐等靜態動作';
COMMENT ON COLUMN public.workout_sets.distance_meters IS '距離（公尺）- 用於跑步、划船等有氧運動';

-- ========== 3. 身體數據記錄 (body_measurements) ==========
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- 測量日期
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- 身體數據
  weight DECIMAL(5, 2), -- 體重 (kg)
  body_fat_percentage DECIMAL(4, 2), -- 體脂率 (%)
  muscle_mass DECIMAL(5, 2), -- 肌肉量 (kg)
  bmi DECIMAL(4, 2), -- BMI

  -- 圍度測量（可選）
  chest_cm DECIMAL(5, 2), -- 胸圍 (cm)
  waist_cm DECIMAL(5, 2), -- 腰圍 (cm)
  hip_cm DECIMAL(5, 2), -- 臀圍 (cm)
  arm_left_cm DECIMAL(5, 2), -- 左臂圍 (cm)
  arm_right_cm DECIMAL(5, 2), -- 右臂圍 (cm)
  thigh_left_cm DECIMAL(5, 2), -- 左大腿圍 (cm)
  thigh_right_cm DECIMAL(5, 2), -- 右大腿圍 (cm)
  calf_left_cm DECIMAL(5, 2), -- 左小腿圍 (cm)
  calf_right_cm DECIMAL(5, 2), -- 右小腿圍 (cm)

  -- 備註
  notes TEXT,

  -- 時間戳記
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 確保每天只有一筆記錄
  UNIQUE(user_id, date)
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_id ON public.body_measurements(user_id);
CREATE INDEX IF NOT EXISTS idx_body_measurements_workspace_id ON public.body_measurements(workspace_id);
CREATE INDEX IF NOT EXISTS idx_body_measurements_date ON public.body_measurements(date);

-- 禁用 RLS（內部系統）
ALTER TABLE public.body_measurements DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.body_measurements IS '身體數據記錄 - 追蹤體重、體脂、圍度等數據';

-- ========== 4. 進度照片 (progress_photos) ==========
CREATE TABLE IF NOT EXISTS public.progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- 照片資訊
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('front', 'side', 'back')), -- 正面/側面/背面
  photo_url TEXT NOT NULL, -- Supabase Storage URL

  -- 關聯的身體數據
  measurement_id UUID REFERENCES public.body_measurements(id) ON DELETE SET NULL,

  -- 備註
  notes TEXT,

  -- 時間戳記
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_progress_photos_user_id ON public.progress_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_photos_workspace_id ON public.progress_photos(workspace_id);
CREATE INDEX IF NOT EXISTS idx_progress_photos_date ON public.progress_photos(date);

-- 禁用 RLS（內部系統）
ALTER TABLE public.progress_photos DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.progress_photos IS '進度照片 - 記錄身體變化照片';

-- ========== 5. 目標設定 (fitness_goals) ==========
CREATE TABLE IF NOT EXISTS public.fitness_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- 目標資訊
  goal_type TEXT NOT NULL CHECK (goal_type IN ('weight', 'strength', 'endurance', 'body_composition', 'custom')),
  title TEXT NOT NULL, -- 例如：「臥推破百」
  description TEXT,

  -- 目標值
  target_value DECIMAL(10, 2), -- 目標值
  current_value DECIMAL(10, 2), -- 目前值
  unit TEXT, -- 單位（kg, reps, seconds, km 等）

  -- 相關動作（如果是力量目標）
  exercise_id INTEGER, -- 對應 exercises.ts
  exercise_name TEXT,

  -- 期限
  target_date DATE,

  -- 狀態
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,

  -- 進度追蹤
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),

  -- 備註
  notes TEXT,

  -- 時間戳記
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_fitness_goals_user_id ON public.fitness_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_fitness_goals_workspace_id ON public.fitness_goals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_fitness_goals_status ON public.fitness_goals(status);
CREATE INDEX IF NOT EXISTS idx_fitness_goals_target_date ON public.fitness_goals(target_date);

-- 禁用 RLS（內部系統）
ALTER TABLE public.fitness_goals DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.fitness_goals IS '目標設定 - 追蹤健身目標進度';
COMMENT ON COLUMN public.fitness_goals.goal_type IS '目標類型：weight(體重)、strength(力量)、endurance(耐力)、body_composition(體態)、custom(自訂)';

-- ========== 6. 個人紀錄 (personal_records) ==========
CREATE TABLE IF NOT EXISTS public.personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- 動作資訊
  exercise_id INTEGER NOT NULL,
  exercise_name TEXT NOT NULL,

  -- PR 紀錄
  max_weight DECIMAL(6, 2), -- 最大重量 (kg)
  max_reps INTEGER, -- 最大次數（在該重量下）
  one_rep_max DECIMAL(6, 2), -- 1RM（計算值）

  -- 達成資訊
  achieved_date DATE NOT NULL,
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,

  -- 時間戳記
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 每個動作只保留最新的 PR
  UNIQUE(user_id, exercise_id)
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_personal_records_user_id ON public.personal_records(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_records_workspace_id ON public.personal_records(workspace_id);
CREATE INDEX IF NOT EXISTS idx_personal_records_exercise_id ON public.personal_records(exercise_id);

-- 禁用 RLS（內部系統）
ALTER TABLE public.personal_records DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.personal_records IS '個人紀錄 (PR) - 記錄各動作的最佳成績';
COMMENT ON COLUMN public.personal_records.one_rep_max IS '1RM = weight × (1 + reps / 30)';

-- ========== 觸發器：自動更新 updated_at ==========
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_workout_sessions_updated_at ON public.workout_sessions;
CREATE TRIGGER update_workout_sessions_updated_at
  BEFORE UPDATE ON public.workout_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workout_sets_updated_at ON public.workout_sets;
CREATE TRIGGER update_workout_sets_updated_at
  BEFORE UPDATE ON public.workout_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_body_measurements_updated_at ON public.body_measurements;
CREATE TRIGGER update_body_measurements_updated_at
  BEFORE UPDATE ON public.body_measurements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_progress_photos_updated_at ON public.progress_photos;
CREATE TRIGGER update_progress_photos_updated_at
  BEFORE UPDATE ON public.progress_photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fitness_goals_updated_at ON public.fitness_goals;
CREATE TRIGGER update_fitness_goals_updated_at
  BEFORE UPDATE ON public.fitness_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_personal_records_updated_at ON public.personal_records;
CREATE TRIGGER update_personal_records_updated_at
  BEFORE UPDATE ON public.personal_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
