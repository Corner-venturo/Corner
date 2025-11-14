-- Fix HSIN employee roles (Taichung office)
BEGIN;

UPDATE public.employees
SET roles = ARRAY['employee']::text[]
WHERE id = '2a644ea8-bcc3-4567-8b6f-001c1be1d315'
  AND (roles IS NULL OR roles = ARRAY[]::text[]);

COMMENT ON TABLE public.employees IS 'Updated HSIN employee to have employee role';

COMMIT;
