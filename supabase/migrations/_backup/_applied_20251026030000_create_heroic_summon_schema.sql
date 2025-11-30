-- ============================================
-- Migration: 建立英靈招喚測驗資料庫結構
-- 日期: 2025-10-26
-- 說明: 120題靈魂英靈測驗系統
-- ============================================

BEGIN;

-- 1. 建立測驗結果表格
CREATE TABLE IF NOT EXISTS public.heroic_summon_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,

  -- 測驗進度
  current_phase INTEGER DEFAULT 1 CHECK (current_phase BETWEEN 1 AND 6),
  current_question INTEGER DEFAULT 1 CHECK (current_question BETWEEN 1 AND 120),
  total_answered INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,

  -- 答案記錄（JSONB 格式）
  answers JSONB DEFAULT '{}',
  -- 格式: { "1": "A", "2": "B", "3": "C", ... }

  -- 各階段完成狀態
  phase_1_completed BOOLEAN DEFAULT FALSE,
  phase_2_completed BOOLEAN DEFAULT FALSE,
  phase_3_completed BOOLEAN DEFAULT FALSE,
  phase_4_completed BOOLEAN DEFAULT FALSE,
  phase_5_completed BOOLEAN DEFAULT FALSE,
  phase_6_completed BOOLEAN DEFAULT FALSE,

  -- 測驗結果（完成後填入）
  result_type TEXT,  -- 英靈類型
  result_description TEXT,  -- 結果描述
  energy_profile JSONB,  -- 能量側寫

  -- 時間戳記
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 建立索引
CREATE INDEX IF NOT EXISTS idx_heroic_summon_employee_id
  ON public.heroic_summon_results(employee_id);

CREATE INDEX IF NOT EXISTS idx_heroic_summon_is_completed
  ON public.heroic_summon_results(is_completed);

CREATE INDEX IF NOT EXISTS idx_heroic_summon_current_phase
  ON public.heroic_summon_results(current_phase);

-- 3. 建立測驗歷史記錄表格（可選）
CREATE TABLE IF NOT EXISTS public.heroic_summon_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  result_id UUID REFERENCES public.heroic_summon_results(id) ON DELETE SET NULL,

  -- 完整測驗快照
  answers JSONB NOT NULL,
  result_type TEXT,
  result_description TEXT,
  energy_profile JSONB,

  -- 時間戳記
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_heroic_summon_history_employee
  ON public.heroic_summon_history(employee_id);

CREATE INDEX IF NOT EXISTS idx_heroic_summon_history_completed_at
  ON public.heroic_summon_history(completed_at DESC);

-- 4. 建立自動更新 updated_at 的觸發器
CREATE OR REPLACE FUNCTION update_heroic_summon_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_heroic_summon_updated_at ON public.heroic_summon_results;
CREATE TRIGGER trigger_heroic_summon_updated_at
  BEFORE UPDATE ON public.heroic_summon_results
  FOR EACH ROW
  EXECUTE FUNCTION update_heroic_summon_updated_at();

-- 5. 建立完成測驗時的歸檔觸發器
CREATE OR REPLACE FUNCTION archive_heroic_summon_result()
RETURNS TRIGGER AS $$
BEGIN
  -- 當測驗完成時，自動歸檔到歷史記錄
  IF NEW.is_completed = TRUE AND (OLD.is_completed = FALSE OR OLD.is_completed IS NULL) THEN
    INSERT INTO public.heroic_summon_history (
      employee_id,
      result_id,
      answers,
      result_type,
      result_description,
      energy_profile,
      completed_at
    ) VALUES (
      NEW.employee_id,
      NEW.id,
      NEW.answers,
      NEW.result_type,
      NEW.result_description,
      NEW.energy_profile,
      NOW()
    );

    NEW.completed_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_archive_heroic_summon ON public.heroic_summon_results;
CREATE TRIGGER trigger_archive_heroic_summon
  BEFORE UPDATE ON public.heroic_summon_results
  FOR EACH ROW
  EXECUTE FUNCTION archive_heroic_summon_result();

-- 6. 建立 RLS 政策
ALTER TABLE public.heroic_summon_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heroic_summon_history ENABLE ROW LEVEL SECURITY;

-- 用戶只能查看和修改自己的測驗結果
CREATE POLICY "Users can view own heroic summon results"
  ON public.heroic_summon_results FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "Users can insert own heroic summon results"
  ON public.heroic_summon_results FOR INSERT
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Users can update own heroic summon results"
  ON public.heroic_summon_results FOR UPDATE
  USING (employee_id = auth.uid());

-- 用戶只能查看自己的測驗歷史
CREATE POLICY "Users can view own heroic summon history"
  ON public.heroic_summon_history FOR SELECT
  USING (employee_id = auth.uid());

-- 7. 欄位註解
COMMENT ON TABLE public.heroic_summon_results IS '英靈招喚測驗結果（進行中與已完成）';
COMMENT ON TABLE public.heroic_summon_history IS '英靈招喚測驗歷史記錄（僅已完成）';

COMMENT ON COLUMN public.heroic_summon_results.answers IS '答案記錄，格式：{"1": "A", "2": "B", ...}';
COMMENT ON COLUMN public.heroic_summon_results.energy_profile IS '能量側寫，格式：{"fire": 30, "water": 25, ...}';
COMMENT ON COLUMN public.heroic_summon_results.result_type IS '英靈類型（例如：戰士、智者、療癒者等）';

-- 驗證
DO $$
BEGIN
  RAISE NOTICE '✅ 英靈招喚測驗資料庫建立完成！';
  RAISE NOTICE '   - heroic_summon_results: 測驗結果表格';
  RAISE NOTICE '   - heroic_summon_history: 測驗歷史記錄';
  RAISE NOTICE '   - 自動歸檔觸發器已設定';
  RAISE NOTICE '   - RLS 政策已啟用';
END $$;

COMMIT;
