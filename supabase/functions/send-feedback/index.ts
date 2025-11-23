import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FeedbackRequest {
  feedback: string;
  userEmail: string;
  userName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { feedback, userEmail, userName }: FeedbackRequest = await req.json();

    console.log("Enviando feedback do usuário:", userEmail);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY não configurada");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "FINZ - Feedback <no-reply@finz.net.br>",
        to: ["no-reply@finz.net.br"],
        reply_to: userEmail,
        subject: `Novo Feedback - ${userName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
                  border-radius: 10px 10px 0 0;
                  text-align: center;
                }
                .content {
                  background: #f9f9f9;
                  padding: 30px;
                  border-radius: 0 0 10px 10px;
                }
                .feedback-box {
                  background: white;
                  padding: 20px;
                  border-radius: 8px;
                  border-left: 4px solid #667eea;
                  margin: 20px 0;
                }
                .user-info {
                  background: #e8eaf6;
                  padding: 15px;
                  border-radius: 8px;
                  margin-bottom: 20px;
                }
                .label {
                  font-weight: 600;
                  color: #667eea;
                  margin-bottom: 5px;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1 style="margin: 0;">📬 Novo Feedback Recebido</h1>
              </div>
              <div class="content">
                <div class="user-info">
                  <div class="label">Usuário:</div>
                  <div>${userName}</div>
                  <div class="label" style="margin-top: 10px;">Email:</div>
                  <div>${userEmail}</div>
                </div>
                
                <div class="label">Mensagem:</div>
                <div class="feedback-box">
                  ${feedback.replace(/\n/g, '<br>')}
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                  Este email foi enviado automaticamente pelo sistema FINZ.
                </p>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Erro ao enviar email:", error);
      throw new Error(`Erro Resend: ${error}`);
    }

    const data = await res.json();
    console.log("Email de feedback enviado com sucesso:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erro na função send-feedback:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);