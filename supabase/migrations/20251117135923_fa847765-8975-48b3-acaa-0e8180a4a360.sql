-- Alterar o default da coluna approved de null para false
ALTER TABLE public.profiles 
ALTER COLUMN approved SET DEFAULT false;

-- Atualizar todos os registros com approved = null para false
UPDATE public.profiles 
SET approved = false 
WHERE approved IS NULL;