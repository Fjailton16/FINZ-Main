-- Remove the overly permissive authentication-only policy
-- Keep only the policy that checks for approved user status
DROP POLICY IF EXISTS "Require authentication to view transactions" ON public.transactions;