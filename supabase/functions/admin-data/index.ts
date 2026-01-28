import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Allowed origins for CORS - include all Lovable domains
const allowedOrigins = [
  "https://prepverse-for-students.lovable.app",
  "https://id-preview--03d1bf87-504b-46dd-bebe-c3667b1313d0.lovable.app",
  "https://03d1bf87-504b-46dd-bebe-c3667b1313d0.lovableproject.com",
  "http://localhost:5173",
  "http://localhost:8080",
];

// Simple in-memory rate limiting (per admin user)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  // Allow all lovable origins dynamically
  const isAllowedOrigin = allowedOrigins.includes(origin) || 
    origin.endsWith('.lovable.app') || 
    origin.endsWith('.lovableproject.com');
  const allowedOrigin = isAllowedOrigin ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user's token for auth verification
    const userSupabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await userSupabase.auth.getUser();
    
    if (authError || !authData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = authData.user.id;

    // Check rate limit before proceeding
    if (!checkRateLimit(userId)) {
      console.warn(`Rate limit exceeded for admin user: ${userId}`);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please wait before making more requests." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use service role to check admin status
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is admin
    const { data: roleData, error: roleError } = await adminSupabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (roleError || roleData?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Access denied. Admin only." }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Log admin data access for audit
    console.log(`Admin data access by user: ${userId} at ${new Date().toISOString()}`);

    // Fetch all users
    const { data: allUsersData, error: listUsersError } = await adminSupabase.auth.admin.listUsers();
    
    if (listUsersError) {
      throw new Error("Failed to fetch users");
    }

    // Fetch all profiles
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("*");

    // Fetch all user roles
    const { data: roles } = await adminSupabase
      .from("user_roles")
      .select("*");

    // Fetch all notes with user info
    const { data: notes } = await adminSupabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch all sessions
    const { data: sessions } = await adminSupabase
      .from("user_sessions")
      .select("*")
      .order("last_active_at", { ascending: false });

    // Fetch all activity
    const { data: activity } = await adminSupabase
      .from("user_activity")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    // Combine user data
    const users = allUsersData.users.map((user: any) => {
      const profile = profiles?.find((p: any) => p.id === user.id);
      const role = roles?.find((r: any) => r.user_id === user.id);
      const userNotes = notes?.filter((n: any) => n.user_id === user.id) || [];
      const userSessions = sessions?.filter((s: any) => s.user_id === user.id) || [];
      const userActivity = activity?.filter((a: any) => a.user_id === user.id) || [];

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
        isActive: userSessions.some((s: any) => s.is_active),
      };
    });

    return new Response(
      JSON.stringify({
        users,
        totalUsers: users.length,
        totalNotes: notes?.length || 0,
        activeUsers: users.filter((u: any) => u.isActive).length,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in admin-data:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);