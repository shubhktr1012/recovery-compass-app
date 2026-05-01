CREATE POLICY "edge_rate_limits is backend only"
  ON public.edge_rate_limits
  AS RESTRICTIVE
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);
