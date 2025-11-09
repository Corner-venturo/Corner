-- 供應商類別管理表
BEGIN;

-- 建立 supplier_categories 表
CREATE TABLE IF NOT EXISTS public.supplier_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT, -- emoji 或圖示
  color TEXT, -- 顏色代碼
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 禁用 RLS（內部系統）
ALTER TABLE public.supplier_categories DISABLE ROW LEVEL SECURITY;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_supplier_categories_name ON public.supplier_categories(name);
CREATE INDEX IF NOT EXISTS idx_supplier_categories_display_order ON public.supplier_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_supplier_categories_is_active ON public.supplier_categories(is_active);

-- 插入預設類別
INSERT INTO public.supplier_categories (name, icon, color, display_order) VALUES
  ('住宿', '🏨', '#e67e22', 1),
  ('交通', '🚌', '#3498db', 2),
  ('餐廳', '🍽️', '#e74c3c', 3),
  ('票務', '🎫', '#9b59b6', 4),
  ('導遊/領隊', '👥', '#1abc9c', 5),
  ('旅行社', '🏢', '#34495e', 6),
  ('其他', '📦', '#95a5a6', 7)
ON CONFLICT (name) DO NOTHING;

-- 修改 suppliers 表，加入 category_id 欄位
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.supplier_categories(id) ON DELETE SET NULL;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_suppliers_category_id ON public.suppliers(category_id);

-- 更新觸發器
CREATE OR REPLACE FUNCTION update_supplier_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_supplier_categories_updated_at ON public.supplier_categories;
CREATE TRIGGER trigger_update_supplier_categories_updated_at
  BEFORE UPDATE ON public.supplier_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_categories_updated_at();

COMMIT;
