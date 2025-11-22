-- Update RLS policies to include master role access
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Recreate policies for profiles table with master access
CREATE POLICY "Admins and Masters can view all profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role)
);

CREATE POLICY "Admins and Masters can update all profiles"
ON public.profiles
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role)
);

-- Add delete policy for profiles (only master can delete)
CREATE POLICY "Masters can delete profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'master'::app_role));

-- Recreate policies for user_roles table
CREATE POLICY "Admins and Masters can view all roles"
ON public.user_roles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role)
);

CREATE POLICY "Masters can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Masters can delete roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'master'::app_role));