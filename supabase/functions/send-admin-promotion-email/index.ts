import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminPromotionEmailRequest {
  name: string;
  email: string;
}

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
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  text-decoration: none;
                  border-radius: 5px;
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
                  background: #fff3cd;
                  padding: 15px;
                  border-left: 4px solid #ffc107;
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
                
                <p>Com esse novo papel, você agora tem acesso a funcionalidades avançadas que permitirão gerenciar e supervisionar o sistema de forma eficiente.</p>
                
                <p style="text-align: center;">
                  <a href="${Deno.env.get("VITE_SUPABASE_URL")?.replace(/\.supabase\.co$/, '.lovableproject.com') || 'https://finz.net.br'}" class="button">
                    Acessar Painel Administrativo
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
