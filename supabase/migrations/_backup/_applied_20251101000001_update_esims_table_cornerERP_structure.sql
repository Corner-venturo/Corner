-- 更新 esims 表格結構，採用 CornerERP 的欄位設計
BEGIN;

-- 刪除舊表格（如果需要重建）
DROP TABLE IF EXISTS public.esims CASCADE;

-- 創建新表格（參考 CornerERP）
CREATE TABLE public.esims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- 網卡單號（自動生成，例如：EABC12301）
  esim_number varchar(25) NOT NULL UNIQUE,

  -- 團號（外鍵關聯到 tours.code）
  group_code varchar(25) NOT NULL,

  -- 訂單編號（外鍵關聯到 orders.code）
  order_number varchar(11),

  -- 供應商訂單編號（FastMove 回傳）
  supplier_order_number varchar(50),

  -- 狀態：0=待確認, 1=已確認, 2=錯誤
  status smallint NOT NULL DEFAULT 0,

  -- 產品 ID（FastMove 產品代碼）
  product_id varchar(50),

  -- 數量（1-9 張）
  quantity integer DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 9),

  -- 信箱（接收 eSIM 的信箱）
  email varchar(255),

  -- 備註
  note text,

  -- 系統欄位
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NOT NULL REFERENCES auth.users(id)
);

-- 禁用 RLS（內部管理系統）
ALTER TABLE public.esims DISABLE ROW LEVEL SECURITY;

-- 索引
CREATE INDEX idx_esims_workspace_id ON public.esims(workspace_id);
CREATE INDEX idx_esims_group_code ON public.esims(group_code);
CREATE INDEX idx_esims_order_number ON public.esims(order_number);
CREATE INDEX idx_esims_status ON public.esims(status);
CREATE INDEX idx_esims_esim_number ON public.esims(esim_number);

-- 註釋
COMMENT ON TABLE public.esims IS 'eSIM 網卡管理（參考 CornerERP）';
COMMENT ON COLUMN public.esims.esim_number IS '網卡單號（E{團號}XX）';
COMMENT ON COLUMN public.esims.group_code IS '團號';
COMMENT ON COLUMN public.esims.order_number IS '訂單編號';
COMMENT ON COLUMN public.esims.supplier_order_number IS '供應商訂單編號（FastMove）';
COMMENT ON COLUMN public.esims.status IS '狀態：0=待確認, 1=已確認, 2=錯誤';
COMMENT ON COLUMN public.esims.product_id IS '產品ID（FastMove）';
COMMENT ON COLUMN public.esims.quantity IS '數量（1-9張）';
COMMENT ON COLUMN public.esims.email IS '接收 eSIM 的信箱';

COMMIT;
