-- Add PERMISSIVE SELECT policy to require authentication for transactions table
-- This prevents anonymous users from accessing financial data
CREATE POLICY "Require authentication to view transactions"
ON public.transactions
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);