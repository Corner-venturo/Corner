-- Add created_by and updated_by to all tables that extend BaseEntity
-- This ensures consistency across all business tables

BEGIN;

-- List of tables that should have created_by and updated_by based on TypeScript types
-- Using IF NOT EXISTS to safely add columns

-- accounting_pro (vouchers)
ALTER TABLE IF EXISTS public.vouchers
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- companies
ALTER TABLE IF EXISTS public.companies
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- confirmations
ALTER TABLE IF EXISTS public.confirmations
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- esims
ALTER TABLE IF EXISTS public.esims
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- pnrs
ALTER TABLE IF EXISTS public.pnrs
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- quotes
ALTER TABLE IF EXISTS public.quotes
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- quote_versions
ALTER TABLE IF EXISTS public.quote_versions
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- receipts
ALTER TABLE IF EXISTS public.receipts
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- suppliers
ALTER TABLE IF EXISTS public.suppliers
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- supplier_service_areas
ALTER TABLE IF EXISTS public.supplier_service_areas
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- cost_templates
ALTER TABLE IF EXISTS public.cost_templates
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- visas
ALTER TABLE IF EXISTS public.visas
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- notes
ALTER TABLE IF EXISTS public.notes
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add comments (COMMENT doesn't support WHERE clause, handle with DO block if needed)

-- Create indexes for better query performance (only if table exists)
CREATE INDEX IF NOT EXISTS idx_vouchers_created_by ON public.vouchers(created_by);
CREATE INDEX IF NOT EXISTS idx_vouchers_updated_by ON public.vouchers(updated_by);

CREATE INDEX IF NOT EXISTS idx_companies_created_by ON public.companies(created_by);
CREATE INDEX IF NOT EXISTS idx_companies_updated_by ON public.companies(updated_by);

CREATE INDEX IF NOT EXISTS idx_confirmations_created_by ON public.confirmations(created_by);
CREATE INDEX IF NOT EXISTS idx_confirmations_updated_by ON public.confirmations(updated_by);

CREATE INDEX IF NOT EXISTS idx_esims_created_by ON public.esims(created_by);
CREATE INDEX IF NOT EXISTS idx_esims_updated_by ON public.esims(updated_by);

CREATE INDEX IF NOT EXISTS idx_pnrs_created_by ON public.pnrs(created_by);
CREATE INDEX IF NOT EXISTS idx_pnrs_updated_by ON public.pnrs(updated_by);

CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON public.quotes(created_by);
CREATE INDEX IF NOT EXISTS idx_quotes_updated_by ON public.quotes(updated_by);

CREATE INDEX IF NOT EXISTS idx_quote_versions_created_by ON public.quote_versions(created_by);
CREATE INDEX IF NOT EXISTS idx_quote_versions_updated_by ON public.quote_versions(updated_by);

CREATE INDEX IF NOT EXISTS idx_receipts_created_by ON public.receipts(created_by);
CREATE INDEX IF NOT EXISTS idx_receipts_updated_by ON public.receipts(updated_by);

CREATE INDEX IF NOT EXISTS idx_suppliers_created_by ON public.suppliers(created_by);
CREATE INDEX IF NOT EXISTS idx_suppliers_updated_by ON public.suppliers(updated_by);

CREATE INDEX IF NOT EXISTS idx_supplier_service_areas_created_by ON public.supplier_service_areas(created_by);
CREATE INDEX IF NOT EXISTS idx_supplier_service_areas_updated_by ON public.supplier_service_areas(updated_by);

CREATE INDEX IF NOT EXISTS idx_cost_templates_created_by ON public.cost_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_cost_templates_updated_by ON public.cost_templates(updated_by);

CREATE INDEX IF NOT EXISTS idx_visas_created_by ON public.visas(created_by);
CREATE INDEX IF NOT EXISTS idx_visas_updated_by ON public.visas(updated_by);

CREATE INDEX IF NOT EXISTS idx_notes_created_by ON public.notes(created_by);
CREATE INDEX IF NOT EXISTS idx_notes_updated_by ON public.notes(updated_by);

COMMIT;
