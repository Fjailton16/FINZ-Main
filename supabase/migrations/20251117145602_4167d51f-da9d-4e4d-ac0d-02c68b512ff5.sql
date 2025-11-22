-- Add UPDATE policy for user_roles table to restrict role modifications to Masters only
CREATE POLICY "Masters can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role));