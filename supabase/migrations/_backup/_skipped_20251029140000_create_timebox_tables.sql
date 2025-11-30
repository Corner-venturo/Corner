-- Timebox 系統資料庫表格
BEGIN;

-- 1. 箱子定義表（可重複使用的箱子模板）
CREATE TABLE IF NOT EXISTS public.timebox_boxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL,
  type text NOT NULL CHECK (type IN ('workout', 'reminder', 'basic')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.timebox_boxes IS 'Timebox 箱子定義（可重複使用的模板）';
COMMENT ON COLUMN public.timebox_boxes.type IS '箱子類型：workout(重訓), reminder(提醒), basic(基本)';

-- 禁用 RLS（內部系統）
ALTER TABLE public.timebox_boxes DISABLE ROW LEVEL SECURITY;

CREATE INDEX idx_timebox_boxes_user_id ON public.timebox_boxes(user_id);
CREATE INDEX idx_timebox_boxes_type ON public.timebox_boxes(type);

-- 2. 週記錄表
CREATE TABLE IF NOT EXISTS public.timebox_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  name text,
  archived boolean DEFAULT false,
  review_notes text,
  review_created_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

COMMENT ON TABLE public.timebox_weeks IS 'Timebox 週記錄';
COMMENT ON COLUMN public.timebox_weeks.archived IS '是否已歸檔';
COMMENT ON COLUMN public.timebox_weeks.review_notes IS '週回顧筆記';

-- 禁用 RLS（內部系統）
ALTER TABLE public.timebox_weeks DISABLE ROW LEVEL SECURITY;

CREATE INDEX idx_timebox_weeks_user_id ON public.timebox_weeks(user_id);
CREATE INDEX idx_timebox_weeks_week_start ON public.timebox_weeks(week_start);
CREATE INDEX idx_timebox_weeks_archived ON public.timebox_weeks(archived);

-- 3. 排程箱子實例表（每週的具體排程）
CREATE TABLE IF NOT EXISTS public.timebox_scheduled_boxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id uuid NOT NULL REFERENCES public.timebox_boxes(id) ON DELETE CASCADE,
  week_id uuid NOT NULL REFERENCES public.timebox_weeks(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time text NOT NULL,
  duration integer NOT NULL CHECK (duration > 0),
  completed boolean DEFAULT false,
  completed_at timestamptz,
  data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.timebox_scheduled_boxes IS 'Timebox 排程實例（每週的具體排程）';
COMMENT ON COLUMN public.timebox_scheduled_boxes.day_of_week IS '星期幾：0=週日, 1=週一, ..., 6=週六';
COMMENT ON COLUMN public.timebox_scheduled_boxes.start_time IS '開始時間（HH:mm 格式）';
COMMENT ON COLUMN public.timebox_scheduled_boxes.duration IS '持續時間（分鐘）';
COMMENT ON COLUMN public.timebox_scheduled_boxes.data IS '額外資料（WorkoutData 或 ReminderData）';

-- 禁用 RLS（內部系統）
ALTER TABLE public.timebox_scheduled_boxes DISABLE ROW LEVEL SECURITY;

CREATE INDEX idx_scheduled_boxes_box_id ON public.timebox_scheduled_boxes(box_id);
CREATE INDEX idx_scheduled_boxes_week_id ON public.timebox_scheduled_boxes(week_id);
CREATE INDEX idx_scheduled_boxes_day ON public.timebox_scheduled_boxes(day_of_week);
CREATE INDEX idx_scheduled_boxes_completed ON public.timebox_scheduled_boxes(completed);

-- 4. 更新時間戳觸發器
CREATE OR REPLACE FUNCTION update_timebox_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_timebox_boxes_updated_at
  BEFORE UPDATE ON public.timebox_boxes
  FOR EACH ROW
  EXECUTE FUNCTION update_timebox_updated_at();

CREATE TRIGGER trigger_timebox_weeks_updated_at
  BEFORE UPDATE ON public.timebox_weeks
  FOR EACH ROW
  EXECUTE FUNCTION update_timebox_updated_at();

CREATE TRIGGER trigger_scheduled_boxes_updated_at
  BEFORE UPDATE ON public.timebox_scheduled_boxes
  FOR EACH ROW
  EXECUTE FUNCTION update_timebox_updated_at();

COMMIT;
