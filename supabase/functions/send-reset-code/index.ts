import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: ResetRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@rmd\.ac\.in$/i;
    if (!emailRegex.test(email)) {
      throw new Error("Only @rmd.ac.in emails are allowed");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error fetching users:", userError);
      throw new Error("Error checking user");
    }

    const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // Don't reveal if email exists or not for security
      return new Response(
        JSON.stringify({ message: "If the email exists, a reset code has been sent" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Invalidate any existing codes for this user
    await supabase
      .from("password_reset_codes")
      .update({ used: true })
      .eq("user_id", user.id)
      .eq("used", false);

    // Insert new code
    const { error: insertError } = await supabase
      .from("password_reset_codes")
      .insert({
        user_id: user.id,
        email: email.toLowerCase(),
        code,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error inserting code:", insertError);
      throw new Error("Failed to generate reset code");
    }

    // Send email using fetch to Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "PrepVerse <onboarding@resend.dev>",
        to: [email],
        subject: "Password Reset Code - PrepVerse",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #6366f1;">PrepVerse Password Reset</h1>
            <p>You requested to reset your password. Use the following code:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6366f1;">${code}</span>
            </div>
            <p>This code will expire in 15 minutes.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Email sent:", emailResult);

    return new Response(
      JSON.stringify({ message: "If the email exists, a reset code has been sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-reset-code:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
