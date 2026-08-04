import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Danh sách tài khoản demo dùng cho việc test đăng nhập nhanh.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data, error } = await admin
      .from("profiles")
      .select("email, full_name, role, branch_id, branches(name)")
      .is("deleted_at", null)
      .order("role")
      .order("full_name");
    if (error) throw error;

    const accounts = (data ?? []).map((p: any) => ({
      email: p.email,
      full_name: p.full_name,
      role: p.role,
      branch: p.branches?.name ?? null,
    }));

    return new Response(JSON.stringify({ accounts, default_password: "Driveschool@2026" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
