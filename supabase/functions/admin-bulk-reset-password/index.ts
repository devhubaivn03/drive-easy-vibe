import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await admin.auth.getUser(token);
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: callerProfile } = await admin.from("profiles").select("role").eq("id", caller.id).single();
    if (callerProfile?.role !== "superadmin") {
      return new Response(JSON.stringify({ error: "Chỉ superadmin được dùng chức năng này" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { new_password = "Driveschool@2026", roles } = await req.json().catch(() => ({}));
    if (typeof new_password !== "string" || new_password.length < 8) {
      return new Response(JSON.stringify({ error: "Mật khẩu tối thiểu 8 ký tự" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let query = admin.from("profiles").select("id, email, role");
    if (Array.isArray(roles) && roles.length > 0) query = query.in("role", roles);
    const { data: profiles, error } = await query;
    if (error) throw error;

    const results: any[] = [];
    for (const p of profiles ?? []) {
      const { error: e } = await admin.auth.admin.updateUserById(p.id, { password: new_password });
      results.push({ email: p.email, role: p.role, ok: !e, error: e?.message });
    }

    return new Response(JSON.stringify({ total: results.length, results, password: new_password }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});