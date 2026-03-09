import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const allowedOrigins = [
  "https://prepverse-for-students.lovable.app",
  "https://id-preview--03d1bf87-504b-46dd-bebe-c3667b1313d0.lovable.app",
  "https://03d1bf87-504b-46dd-bebe-c3667b1313d0.lovableproject.com",
  "http://localhost:5173",
  "http://localhost:8080",
];

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const isAllowedOrigin = allowedOrigins.includes(origin) || 
    origin.endsWith('.lovable.app') || 
    origin.endsWith('.lovableproject.com');
  const allowedOrigin = isAllowedOrigin ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-stainless-arch, x-stainless-lang, x-stainless-os, x-stainless-package-version, x-stainless-retry-count, x-stainless-runtime, x-stainless-runtime-version",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) return false;
  userLimit.count++;
  return true;
}

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userSupabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: authData, error: authError } = await userSupabase.auth.getUser();
  if (authError || !authData?.user) throw new Error("Unauthorized");

  const userId = authData.user.id;
  if (!checkRateLimit(userId)) throw new Error("Rate limit exceeded");

  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: roleData, error: roleError } = await adminSupabase
    .from("user_roles").select("role").eq("user_id", userId).maybeSingle();

  if (roleError || roleData?.role !== "admin") throw new Error("Access denied");

  return { userId, adminSupabase };
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if this is an action request (POST with body)
    if (req.method === "POST") {
      const body = await req.json().catch(() => null);
      
      if (body?.action) {
        const { userId, adminSupabase } = await verifyAdmin(req);
        console.log(`Admin action '${body.action}' by user: ${userId}`);

        // Handle approve premium payment
        if (body.action === "approve_payment") {
          const { payment_id, user_id: targetUserId } = body;
          if (!payment_id || !targetUserId) throw new Error("Missing payment_id or user_id");

          await adminSupabase.from("payments").update({ status: "completed" }).eq("id", payment_id);
          await adminSupabase.from("profiles").update({
            is_premium: true,
            premium_activated_at: new Date().toISOString(),
          }).eq("id", targetUserId);

          return new Response(JSON.stringify({ success: true }), {
            status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        // Handle reject premium payment
        if (body.action === "reject_payment") {
          const { payment_id } = body;
          if (!payment_id) throw new Error("Missing payment_id");

          await adminSupabase.from("payments").update({ status: "rejected" }).eq("id", payment_id);

          return new Response(JSON.stringify({ success: true }), {
            status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        // Handle delete note
        if (body.action === "delete_note") {
          const { note_id } = body;
          if (!note_id) throw new Error("Missing note_id");

          await adminSupabase.from("note_reviews").delete().eq("note_id", note_id);
          await adminSupabase.from("note_purchases").delete().eq("note_id", note_id);
          await adminSupabase.from("notes").delete().eq("id", note_id);

          return new Response(JSON.stringify({ success: true }), {
            status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        // Handle delete user (deactivate)
        if (body.action === "delete_user") {
          const { user_id: targetUserId } = body;
          if (!targetUserId) throw new Error("Missing user_id");

          // Delete user's notes, activity, sessions, etc.
          await adminSupabase.from("notes").delete().eq("user_id", targetUserId);
          await adminSupabase.from("user_activity").delete().eq("user_id", targetUserId);
          await adminSupabase.from("user_sessions").delete().eq("user_id", targetUserId);
          await adminSupabase.from("user_roles").delete().eq("user_id", targetUserId);
          await adminSupabase.from("profiles").delete().eq("id", targetUserId);
          await adminSupabase.auth.admin.deleteUser(targetUserId);

          return new Response(JSON.stringify({ success: true }), {
            status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        throw new Error("Unknown action");
      }
    }

    // Default: fetch admin data (GET or POST without action)
    const { userId, adminSupabase } = await verifyAdmin(req);
    console.log(`Admin data access by user: ${userId} at ${new Date().toISOString()}`);

    const { data: allUsersData, error: listUsersError } = await adminSupabase.auth.admin.listUsers();
    if (listUsersError) throw new Error("Failed to fetch users");

    const { data: profiles } = await adminSupabase.from("profiles").select("*");
    const { data: roles } = await adminSupabase.from("user_roles").select("*");
    const { data: notes } = await adminSupabase.from("notes").select("*").order("created_at", { ascending: false });
    const { data: sessions } = await adminSupabase.from("user_sessions").select("*").order("last_active_at", { ascending: false });
    const { data: activity } = await adminSupabase.from("user_activity").select("*").order("created_at", { ascending: false }).limit(100);

    // Fetch pending premium payments
    const { data: pendingPayments } = await adminSupabase
      .from("payments")
      .select("*")
      .eq("payment_type", "premium")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    const ACTIVE_THRESHOLD_MS = 5 * 60 * 1000;
    const now = Date.now();
    
    const users = allUsersData.users.map((user: any) => {
      const profile = profiles?.find((p: any) => p.id === user.id);
      const role = roles?.find((r: any) => r.user_id === user.id);
      const userNotes = notes?.filter((n: any) => n.user_id === user.id) || [];
      const userSessions = sessions?.filter((s: any) => s.user_id === user.id) || [];
      const userActivity = activity?.filter((a: any) => a.user_id === user.id) || [];

      const isActive = userSessions.some((s: any) => {
        if (!s.is_active) return false;
        const lastActive = new Date(s.last_active_at).getTime();
        return (now - lastActive) < ACTIVE_THRESHOLD_MS;
      });

      return {
        id: user.id,
        email: user.email,
        fullName: profile?.full_name || user.user_metadata?.full_name || "Unknown",
        role: role?.role || "student",
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at,
        notesCount: userNotes.length,
        notes: userNotes,
        sessions: userSessions,
        activity: userActivity,
        isActive,
      };
    });

    // Enrich pending payments with user info
    const enrichedPayments = (pendingPayments || []).map((p: any) => {
      const profile = profiles?.find((pr: any) => pr.id === p.user_id);
      return {
        ...p,
        userName: profile?.full_name || "Unknown",
        userEmail: profile?.email || "",
      };
    });

    return new Response(
      JSON.stringify({
        users,
        totalUsers: users.length,
        totalNotes: notes?.length || 0,
        activeUsers: users.filter((u: any) => u.isActive).length,
        pendingPayments: enrichedPayments,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in admin-data:", error);
    const status = error.message === "Unauthorized" ? 401 : error.message === "Access denied" ? 403 : error.message === "Rate limit exceeded" ? 429 : 500;
    return new Response(
      JSON.stringify({ error: error.message }),
      { status, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
