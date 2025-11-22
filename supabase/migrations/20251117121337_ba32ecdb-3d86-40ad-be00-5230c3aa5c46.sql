-- Habilitar replica identity para atualização em tempo real
ALTER TABLE public.transactions REPLICA IDENTITY FULL;

-- Adicionar a tabela transactions à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;