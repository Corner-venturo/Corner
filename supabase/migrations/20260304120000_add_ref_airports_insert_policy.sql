-- Allow authenticated users to insert new airports
CREATE POLICY IF NOT EXISTS "ref_airports_authenticated_insert"
  ON public.ref_airports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update airports (e.g. usage_count)
CREATE POLICY IF NOT EXISTS "ref_airports_authenticated_update"
  ON public.ref_airports
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
