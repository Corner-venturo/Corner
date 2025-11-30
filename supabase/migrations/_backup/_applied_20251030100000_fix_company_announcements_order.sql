-- 修正公司公告群組的 order，確保永遠在最上面
BEGIN;

UPDATE public.channel_groups
SET "order" = -999
WHERE name = '📢 公司公告';

COMMIT;
