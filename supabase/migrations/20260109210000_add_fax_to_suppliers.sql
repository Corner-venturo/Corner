-- 為 suppliers 表新增 fax 欄位

BEGIN;

ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS fax VARCHAR(30);

COMMENT ON COLUMN public.suppliers.fax IS '傳真號碼';

COMMIT;
