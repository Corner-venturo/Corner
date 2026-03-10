-- Add created_by column to employees table
-- This is a standard audit field that tracks who created each employee record

ALTER TABLE public.employees 
ADD COLUMN created_by UUID REFERENCES public.employees(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.employees.created_by IS '建立此員工記錄的員工 ID';
