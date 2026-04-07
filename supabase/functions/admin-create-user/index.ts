import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Verify the caller is authenticated and has appropriate role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);

    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get caller profile to check role
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role, id, admin_id")
      .eq("id", caller.id)
      .single();

    if (!callerProfile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, password, full_name, phone, role, admin_id, teacher_id, license_type } = body;

    // Role-based permission check
    const allowedCreations: Record<string, string[]> = {
      superadmin: ["admin", "teacher", "staff", "client"],
      admin: ["teacher", "staff", "client"],
      staff: ["client"],
    };

    if (!allowedCreations[callerProfile.role]?.includes(role)) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user via admin API (no email confirmation needed)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine admin_id based on caller role
    let resolvedAdminId = admin_id;
    if (callerProfile.role === "admin") {
      resolvedAdminId = callerProfile.id;
    } else if (callerProfile.role === "staff") {
      resolvedAdminId = callerProfile.admin_id;
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: newUser.user!.id,
      email,
      full_name,
      phone: phone || null,
      role,
      admin_id: resolvedAdminId || null,
      teacher_id: teacher_id || null,
      license_type: license_type || null,
      created_by: caller.id,
    });

    if (profileError) {
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user!.id);
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ user: { id: newUser.user!.id, email, role } }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
