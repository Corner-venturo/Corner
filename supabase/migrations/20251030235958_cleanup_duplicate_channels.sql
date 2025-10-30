-- 清理重複的 channels（保留最早建立的）

BEGIN;

-- 刪除重複的（保留 created_at 最早的）
DELETE FROM channels
WHERE name = '總部辦公室'
  AND id NOT IN (
    SELECT DISTINCT ON (name, workspace_id) id
    FROM channels
    WHERE name = '總部辦公室'
    ORDER BY name, workspace_id, created_at ASC
  );

COMMIT;
