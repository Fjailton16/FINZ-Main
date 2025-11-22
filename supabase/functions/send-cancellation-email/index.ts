// ARQUIVO: supabase/functions/delete-user-completely/index.ts

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// 1. Inicializa o cliente Supabase com Service Role Key (Permissões de Admin)
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Este cliente é usado para operações de alto privilégio (fetch data and delete user)
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
});

// A chave do Resend já está configurada
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const handler = async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    console.log(`Iniciando exclusão completa para o userId: ${userId}`);

    // =====================================================
    // 2. BUSCAR DADOS DO USUÁRIO (NECESSÁRIO PARA O EMAIL)
    // =====================================================
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (fetchError || !profile) {
      console.error("Erro ao buscar perfil ou perfil não encontrado. Prosseguindo com a exclusão...", fetchError?.message);
      // OPTIONAL: Você pode parar aqui, mas geralmente prosseguimos para tentar deletar
    }

    const userName = profile?.full_name || 'Usuário FINZ';
    const userEmail = profile?.email || 'email-invalido@exemplo.com';
    
    // =====================================================
    // 3. ENVIAR EMAIL DE CANCELAMENTO (Lógica do Resend)
    // =====================================================
    if (userEmail !== 'email-invalido@exemplo.com' && RESEND_API_KEY) {
        console.log(`Enviando email de cancelamento para: ${userEmail}`);
        
        const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: "FINZ <no-reply@finz.net.br>", // CONFIRA SE ESTE DOMÍNIO ESTÁ VERIFICADO NO RESEND!
                to: [userEmail],
                subject: "Conta Excluída - FINZ",
                html: `
                   <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <p>Olá <strong>${userName}</strong>,</p>
                    <p>Informamos que sua conta no FINZ foi <strong>permanentemente excluída</strong> por um administrador do sistema.</p>
                    </div>
                `
            })
        });

        const emailResult = await emailResponse.json();
        if (!emailResponse.ok) {
            console.error("ERRO ao enviar email via Resend:", emailResult);
        } else {
            console.log("Email de cancelamento enviado com sucesso.", emailResult);
        }
    } else {
        console.warn("Email não enviado: Chave Resend ausente ou email do usuário inválido.");
    }

    // =====================================================
    // 4. EXCLUIR O USUÁRIO (Ação principal)
    // =====================================================
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Erro FATAL ao excluir o usuário via Auth Admin:", deleteError);
      throw new Error(deleteError.message);
    }
    
    console.log(`Usuário ${userId} excluído com sucesso!`);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    console.error("Erro geral na função delete-user-completely:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

serve(handler);