-- 刪除所有重複的 channels（保留 created_at 最早的）
BEGIN;

WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY name, workspace_id
      ORDER BY created_at ASC
    ) as rn
  FROM channels
)
DELETE FROM channels
WHERE id IN (
  SELECT id
  FROM duplicates
  WHERE rn > 1
);

COMMIT;
