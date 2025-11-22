import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ProvisionalPasswordRequest {
  email: string;
}

const generateProvisionalPassword = (): string => {
  const length = 10;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: ProvisionalPasswordRequest = await req.json();
    console.log("Processando solicitação de senha provisória para:", email);

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if user exists
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("Erro ao listar usuários:", listError);
      throw new Error("Erro ao verificar usuário");
    }

    const user = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      console.log("Usuário não encontrado:", email);
      // Return success even if user doesn't exist (security best practice)
      return new Response(
        JSON.stringify({ message: "Se o email existir, uma senha provisória será enviada." }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate provisional password
    const provisionalPassword = generateProvisionalPassword();
    console.log("Senha provisória gerada para:", email);

    // Update user password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: provisionalPassword }
    );

    if (updateError) {
      console.error("Erro ao atualizar senha:", updateError);
      throw new Error("Erro ao gerar senha provisória");
    }
    
    console.log("Senha atualizada com sucesso para o usuário:", email);

    // Get user name from profiles
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const userName = profile?.full_name || email.split("@")[0];

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    // Send email with provisional password
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "FINZ <no-reply@finz.net.br>",
        to: [email],
        subject: "Sua senha provisória - FINZ",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .password-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 5px; }
              .password { font-size: 24px; font-weight: bold; color: #667eea; text-align: center; letter-spacing: 2px; font-family: monospace; }
              .warning { background: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107; border-radius: 5px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🔑 Senha Provisória</h1>
                <p style="margin: 10px 0 0 0;">FINZ - Gestão Financeira</p>
              </div>
              <div class="content">
                <h2>Olá, ${userName}!</h2>
                <p>Você solicitou a recuperação de senha da sua conta no FINZ.</p>
                
                <div class="password-box">
                  <p style="margin: 0 0 10px 0; text-align: center; color: #666;">Sua senha provisória é:</p>
                  <div class="password">${provisionalPassword}</div>
                </div>

                <div class="warning">
                  <strong>⚠️ Importante:</strong>
                  <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Esta é uma senha provisória gerada automaticamente</li>
                    <li>Recomendamos que você altere esta senha após fazer login</li>
                    <li>Acesse seu perfil e defina uma nova senha segura</li>
                    <li>Não compartilhe esta senha com ninguém</li>
                  </ul>
                </div>

                <p>Para acessar sua conta:</p>
                <ol>
                  <li>Acesse a tela de login do FINZ</li>
                  <li>Use seu email e a senha provisória acima</li>
                  <li>Vá em "Perfil" e altere sua senha</li>
                </ol>

                <p>Se você não solicitou esta recuperação de senha, por favor ignore este email e sua senha anterior permanecerá ativa.</p>

                <div class="footer">
                  <p>Este é um email automático, por favor não responda.</p>
                  <p>&copy; ${new Date().getFullYear()} FINZ - Todos os direitos reservados</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Erro ao enviar email:", errorData);
      throw new Error("Falha ao enviar email");
    }

    const emailData = await emailResponse.json();
    console.log("Email enviado com sucesso:", emailData);

    return new Response(
      JSON.stringify({ 
        message: "Senha provisória enviada com sucesso!",
        emailId: emailData.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Erro na função send-provisional-password:", error);
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
