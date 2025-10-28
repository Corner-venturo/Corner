-- 新增菲律賓城市的機場代碼
-- 目的：修正宿務和長灘島缺少機場代碼的問題

BEGIN;

-- 更新菲律賓城市的機場代碼
UPDATE public.cities SET airport_code = 'CEB' WHERE id = 'cebu';        -- 宿務 (Mactan-Cebu International Airport)
UPDATE public.cities SET airport_code = 'MPH' WHERE id = 'boracay';     -- 長灘島 (Caticlan/Godofredo P. Ramos Airport)

COMMIT;
