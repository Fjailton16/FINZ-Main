// ARQUIVO: supabase/functions/admin-promotion-email/index.ts (DESIGN ORIGINAL RESTAURADO)

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminPromotionEmailRequest {
  name: string;
  email: string;
}

// 1. CARREGA VARIÁVEIS DE AMBIENTE
// Define o link base do seu aplicativo
const APP_URL = Deno.env.get("APP_BASE_URL") || 'https://finz.net.br';

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email }: AdminPromotionEmailRequest = await req.json();
    console.log("Enviando email de promoção a administrador para:", email);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY não está configurada");
    }

    // Log de diagnóstico para confirmar a URL sendo usada
    console.log(`URL do Painel Admin (Auth) Gerada: ${APP_URL}/auth`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "FINZ <no-reply@finz.net.br>",
        to: [email],
        subject: "Você foi promovido a Administrador - FINZ",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .header {
                  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); /* Vermelho/Vinho */
                  color: white;
                  padding: 30px;
                  text-align: center;
                  border-radius: 10px 10px 0 0;
                }
                .content {
                  background: #f9f9f9;
                  padding: 30px;
                  border-radius: 0 0 10px 10px;
                }
                .button {
                  display: inline-block;
                  padding: 12px 30px;
                  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); /* Vermelho/Vinho */
                  color: white;
                  text-decoration: none;
                  border-radius: 5px;
                  font-weight: bold;
                  margin: 20px 0;
                }
                .footer {
                  text-align: center;
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #ddd;
                  color: #777;
                  font-size: 12px;
                }
                .highlight {
                  background: #fee2e2; /* Fundo vermelho claro */
                  padding: 15px;
                  border-left: 4px solid #dc2626; /* Borda vermelha */
                  margin: 20px 0;
                }
                ul {
                  margin: 15px 0;
                  padding-left: 20px;
                }
                li {
                  margin: 8px 0;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Parabéns, ${name}!</h1>
                </div>
                <div class="content">
                  <p>Olá, <strong>${name}</strong>!</p>
                
                  <p>Temos o prazer de informar que você foi <strong>promovido a Administrador</strong> no sistema FINZ!</p>
                  
                  <div class="highlight">
                    <strong>🔑 Novas Permissões Administrativas:</strong>
                    <ul>
                      <li>Aprovar ou negar novos cadastros de usuários</li>
                      <li>Visualizar e gerenciar todos os usuários do sistema</li>
                      <li>Acessar o painel administrativo completo</li>
                      <li>Monitorar atividades do sistema</li>
                    </ul>
                  </div>
                  
                  <p>Para acessar suas novas funcionalidades, clique no botão abaixo e faça login na sua conta:</p>
                  
                  <p style="text-align: center;">
                    <a href="${APP_URL}/auth" class="button">
                      Acessar o Sistema
                    </a>
                  </p>
                  
                  <p><strong>Importante:</strong> Com grandes poderes vêm grandes responsabilidades. Por favor, utilize suas novas permissões de forma ética e responsável.</p>
                  
                  <p>Se você tiver alguma dúvida sobre suas novas responsabilidades ou precisar de orientação, não hesite em entrar em contato.</p>
                  
                  <p>Bem-vindo à equipe administrativa!</p>
                  
                  <p>Atenciosamente,<br>
                  <strong>Equipe FINZ</strong></p>
                </div>
                <div class="footer">
                  <p>Este é um e-mail automático. Por favor, não responda.</p>
                  <p>&copy; ${new Date().getFullYear()} FINZ. Todos os direitos reservados.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Erro ao enviar email via Resend:", error);
      throw new Error(`Erro ao enviar email: ${error}`);
    }

    const data = await res.json();
    console.log("Email de promoção a administrador enviado com sucesso:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erro na função send-admin-promotion-email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);