import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PendingEmailRequest {
  name: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Recebendo requisição para email de cadastro pendente");
    const { name, email }: PendingEmailRequest = await req.json();
    console.log("Enviando email para:", email, "Nome:", name);

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
        subject: "Cadastro Realizado - Aguardando Aprovação",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1e3a8a;">Bem-vindo ao FINZ, ${name}!</h1>
            <p style="font-size: 16px; color: #333;">
              Seu cadastro foi realizado com sucesso!
            </p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #059669; margin-top: 0;">📋 Próximos Passos:</h2>
              <ol style="color: #555; line-height: 1.8;">
                <li>Seu cadastro está <strong>pendente de aprovação</strong></li>
                <li>Um administrador irá revisar suas informações</li>
                <li>Você receberá um email quando seu cadastro for aprovado</li>
                <li>Após a aprovação, você terá acesso completo ao sistema</li>
              </ol>
            </div>
            <p style="font-size: 14px; color: #666;">
              Este processo geralmente leva até 24 horas. Agradecemos sua paciência!
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
    console.log("Email enviado com sucesso:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erro ao enviar email de cadastro pendente:", error);
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
