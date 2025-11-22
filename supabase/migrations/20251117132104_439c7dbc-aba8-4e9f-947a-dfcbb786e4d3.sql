-- Atualizar política para permitir que usuários vejam seu próprio perfil mesmo quando não aprovados
-- Isso é necessário para o fluxo de login verificar o status de aprovação

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- A política de update permanece restrita a usuários aprovados
-- Mantém a segurança enquanto permite verificação de status no login