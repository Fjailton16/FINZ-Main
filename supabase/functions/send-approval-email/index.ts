import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalEmailRequest {
  name: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Recebendo requisição para email de aprovação");
    const { name, email }: ApprovalEmailRequest = await req.json();
    console.log("Enviando email de aprovação para:", email, "Nome:", name);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "FINZ <no-reply@finz.net.br>",
        to: [email],
        subject: "Cadastro Aprovado - Bem-vindo ao FINZ!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #059669;">🎉 Parabéns, ${name}!</h1>
            <p style="font-size: 16px; color: #333;">
              Seu cadastro foi <strong style="color: #059669;">aprovado com sucesso</strong>!
            </p>
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
              <h2 style="color: #1e3a8a; margin-top: 0;">✅ Você já pode acessar o FINZ!</h2>
              <p style="color: #555; line-height: 1.8;">
                Agora você tem acesso completo a todas as funcionalidades do sistema:
              </p>
              <ul style="color: #555; line-height: 1.8;">
                <li>📊 Adicionar e gerenciar transações</li>
                <li>💰 Acompanhar seu saldo em tempo real</li>
                <li>📈 Visualizar relatórios e gráficos</li>
                <li>📅 Analisar gastos mensais e anuais</li>
                <li>🔔 Receber alertas financeiros</li>
              </ul>
            </div>
            <p style="font-size: 14px; color: #666;">
              Comece agora a organizar suas finanças de forma simples e eficiente!
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="font-size: 12px; color: #999;">
              Equipe FINZ - Gerencie seu dinheiro com facilidade
            </p>
          </div>
        `,
      }),
    });

    const result = await emailResponse.json();
    console.log("Email de aprovação enviado com sucesso:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erro ao enviar email de aprovação:", error);
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
