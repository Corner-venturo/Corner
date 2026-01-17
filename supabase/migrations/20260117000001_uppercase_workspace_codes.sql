-- 將所有 workspace code 改為大寫
BEGIN;

UPDATE public.workspaces
SET code = UPPER(code)
WHERE code != UPPER(code);

COMMIT;
