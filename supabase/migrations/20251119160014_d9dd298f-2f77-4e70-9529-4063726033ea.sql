-- Fix RLS policies to prevent anonymous access to sensitive tables

-- ============================================
-- PROFILES TABLE - Fix policies
-- ============================================

-- Drop and recreate policies with proper TO authenticated
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and Masters can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and Masters can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Masters can delete profiles" ON public.profiles;

-- SELECT policies - only authenticated users
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins and Masters can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

-- INSERT policy - only authenticated users can create their profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE policies - only authenticated users
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = id) AND (approved = true));

CREATE POLICY "Admins and Masters can update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

-- DELETE policy - only authenticated masters
CREATE POLICY "Masters can delete profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'master'::app_role));

-- ============================================
-- TRANSACTIONS TABLE - Fix policies
-- ============================================

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;

-- All transaction policies require authentication
CREATE POLICY "Users can view own transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id) AND (EXISTS (
    SELECT 1 FROM profiles 
    WHERE (profiles.id = auth.uid()) AND (profiles.approved = true)
  )));

CREATE POLICY "Users can insert own transactions"
  ON public.transactions
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id) AND (EXISTS (
    SELECT 1 FROM profiles 
    WHERE (profiles.id = auth.uid()) AND (profiles.approved = true)
  )));

CREATE POLICY "Users can update own transactions"
  ON public.transactions
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id) AND (EXISTS (
    SELECT 1 FROM profiles 
    WHERE (profiles.id = auth.uid()) AND (profiles.approved = true)
  )));

CREATE POLICY "Users can delete own transactions"
  ON public.transactions
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id) AND (EXISTS (
    SELECT 1 FROM profiles 
    WHERE (profiles.id = auth.uid()) AND (profiles.approved = true)
  )));

-- ============================================
-- USER_ROLES TABLE - Fix policies
-- ============================================

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins and Masters can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Masters can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Masters can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Masters can delete roles" ON public.user_roles;

-- SELECT policies - only authenticated users
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins and Masters can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

-- INSERT, UPDATE, DELETE - only masters
CREATE POLICY "Masters can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Masters can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Masters can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'master'::app_role));