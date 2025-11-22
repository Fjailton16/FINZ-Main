// ARQUIVO: supabase/functions/delete-user-completely/index.ts

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// =====================================================
// 1. CONFIGURAÇÃO DE SECRETS E CLIENTE ADMIN
// =====================================================

// Variáveis de Ambiente (Secrets)
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Cliente Supabase com permissões de Service Role (Admin)
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
});

const handler = async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 2. Obtém o userId do corpo da requisição
    const { userId } = await req.json();
    console.log(`Iniciando exclusão completa para o userId: ${userId}`);

    // =====================================================
    // 3. BUSCAR DADOS DO USUÁRIO (NECESSÁRIO PARA O EMAIL)
    // =====================================================
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (fetchError || !profile) {
      console.error(`Erro ao buscar perfil (${userId}) ou perfil não encontrado. Prosseguindo apenas com a exclusão.`, fetchError?.message);
    }

    const userName = profile?.full_name || 'Usuário FINZ';
    const userEmail = profile?.email;
    
    // =====================================================
    // 4. ENVIAR EMAIL DE CANCELAMENTO (Chamada ao Resend)
    // =====================================================
    if (userEmail && RESEND_API_KEY) {
        console.log(`Chave Resend OK. Enviando email para: ${userEmail}`);
        
        const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: "FINZ <no-reply@finz.net.br>",
                to: [userEmail],
                subject: "Conta Excluída - FINZ",
                html: `
                   <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                     <div style="text-align: center; margin-bottom: 30px;">
                       <h1 style="color: #dc2626; margin: 0; font-size: 28px;">FINZ</h1>
                       <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Gestão Financeira Inteligente</p>
                     </div>
                     
                     <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 30px; border-radius: 12px; margin: 20px 0; box-shadow: 0 2px 8px rgba(220, 38, 38, 0.1);">
                       <h2 style="color: #dc2626; margin: 0 0 15px 0; font-size: 24px;">Conta Excluída</h2>
                       <p style="font-size: 16px; color: #333; margin: 0 0 10px 0;">
                         Olá <strong>${userName}</strong>,
                       </p>
                       <p style="color: #555; line-height: 1.8; margin: 0;">
                         Informamos que sua conta no FINZ foi <strong>permanentemente excluída</strong> por um administrador do sistema.
                       </p>
                     </div>
 
                     <div style="background-color: #f9fafb; padding: 25px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
                       <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">O que isso significa?</h3>
                       <ul style="color: #555; line-height: 1.8; margin: 0; padding-left: 20px;">
                         <li style="margin-bottom: 10px;">Todos os seus dados pessoais foram removidos permanentemente de nosso sistema</li>
                         <li style="margin-bottom: 10px;">Suas transações e registros financeiros não podem mais ser acessados</li>
                         <li style="margin-bottom: 10px;">Seu endereço de e-mail está disponível para um novo cadastro, se desejar</li>
                       </ul>
                     </div>
 
                     <div style="background-color: #fff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0;">
                       <p style="font-size: 14px; color: #666; line-height: 1.6; margin: 0 0 15px 0;">
                         <strong>Se você acredita que isso foi um engano</strong>, entre em contato com nossa equipe de suporte o mais rápido possível.
                       </p>
                       <p style="font-size: 14px; color: #666; line-height: 1.6; margin: 0;">
                         <strong>Deseja criar uma nova conta?</strong> Você pode se cadastrar novamente a qualquer momento em nossa plataforma.
                       </p>
                     </div>
 
                     <hr style="border: none; border-top: 2px solid #e5e7eb; margin: 30px 0;">
                     
                     <div style="text-align: center;">
                       <p style="font-size: 12px; color: #999; margin: 0 0 5px 0;">
                         © ${new Date().getFullYear()} FINZ - Todos os direitos reservados
                       </p>
                       <p style="font-size: 12px; color: #999; margin: 0;">
                         Gerencie seu dinheiro com facilidade e inteligência
                       </p>
                     </div>
                   </div>
                `
            })
        });

        const emailResult = await emailResponse.json();
        if (!emailResponse.ok) {
            console.error("ERRO ao enviar email via Resend:", emailResult);
        } else {
            console.log("Email de cancelamento enviado com sucesso.");
        }
    } else {
        console.warn(`Email não enviado: Email do usuário (${userEmail}) ou Chave Resend ausente.`);
    }

    // =====================================================
    // 5. EXCLUIR O USUÁRIO (Ação crítica usando Service Role Key)
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