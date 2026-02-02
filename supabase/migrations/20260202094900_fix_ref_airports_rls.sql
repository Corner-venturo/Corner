-- Fix: ref_airports had RLS enabled but no policies
-- This caused the frontend to return empty arrays

-- Public read access for ref_airports (reference data)
CREATE POLICY IF NOT EXISTS "ref_airports_public_read" 
  ON public.ref_airports 
  FOR SELECT 
  USING (true);

-- Comment explaining the policy
COMMENT ON POLICY "ref_airports_public_read" ON public.ref_airports IS 
  'Allow public read access to airport reference data';
