-- Add monthly_salary column to employees table
BEGIN;

ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC(10, 2) DEFAULT 30000;

COMMENT ON COLUMN public.employees.monthly_salary IS '月薪';

-- Update existing employees to have default salary
UPDATE public.employees
SET monthly_salary = 30000
WHERE monthly_salary IS NULL;

COMMIT;
