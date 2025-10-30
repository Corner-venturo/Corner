-- 新增 created_by 和 updated_by 欄位到 calendar_events
-- 這些欄位是 BaseEntity 的標準欄位，用於追蹤建立者和最後修改者

-- 新增 created_by 欄位
ALTER TABLE calendar_events
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES employees(id) ON DELETE SET NULL;

-- 新增 updated_by 欄位
ALTER TABLE calendar_events
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES employees(id) ON DELETE SET NULL;

-- 為現有資料設定 created_by = owner_id（向後相容）
UPDATE calendar_events
SET created_by = owner_id
WHERE created_by IS NULL;

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_events_updated_by ON calendar_events(updated_by);

-- 註解說明
COMMENT ON COLUMN calendar_events.created_by IS '建立者 ID';
COMMENT ON COLUMN calendar_events.updated_by IS '最後修改者 ID';
