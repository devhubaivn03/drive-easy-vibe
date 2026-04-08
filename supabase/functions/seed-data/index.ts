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

    const users = [
      { email: "superadmin@driveschool.vn", password: "Super@123", full_name: "Super Admin", role: "superadmin", phone: "0901000000" },
      { email: "admin@driveschool.vn", password: "Admin@123", full_name: "Nguyễn Văn Admin", role: "admin", phone: "0901000001" },
      { email: "teacher1@driveschool.vn", password: "Teacher@123", full_name: "Trần Minh Thầy", role: "teacher", phone: "0901000002" },
      { email: "teacher2@driveschool.vn", password: "Teacher@123", full_name: "Lê Thị Cô", role: "teacher", phone: "0901000003" },
      { email: "staff1@driveschool.vn", password: "Staff@123", full_name: "Phạm Nhân Viên", role: "staff", phone: "0901000004" },
      { email: "staff2@driveschool.vn", password: "Staff@123", full_name: "Hoàng Văn Staff", role: "staff", phone: "0901000005" },
      { email: "hocvien1@driveschool.vn", password: "Client@123", full_name: "Đỗ Thanh Học", role: "client", phone: "0901000006", license_type: "B2" },
      { email: "hocvien2@driveschool.vn", password: "Client@123", full_name: "Vũ Ngọc Mai", role: "client", phone: "0901000007", license_type: "B1" },
      { email: "hocvien3@driveschool.vn", password: "Client@123", full_name: "Bùi Đức Anh", role: "client", phone: "0901000008", license_type: "A1" },
      { email: "hocvien4@driveschool.vn", password: "Client@123", full_name: "Ngô Phương Linh", role: "client", phone: "0901000009", license_type: "B2" },
      { email: "hocvien5@driveschool.vn", password: "Client@123", full_name: "Lý Minh Tuấn", role: "client", phone: "0901000010", license_type: "C" },
    ];

    const ids: Record<string, string> = {};
    const results: string[] = [];

    for (const u of users) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
      });
      if (error) {
        results.push(`Skip ${u.email}: ${error.message}`);
        // Try to get existing user
        const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
        const found = existing?.users?.find((eu: any) => eu.email === u.email);
        if (found) ids[u.email] = found.id;
        continue;
      }
      ids[u.email] = data.user.id;
      results.push(`Created: ${u.email}`);
    }

    const adminId = ids["admin@driveschool.vn"];
    const t1 = ids["teacher1@driveschool.vn"];
    const t2 = ids["teacher2@driveschool.vn"];

    // Insert profiles
    const profiles = users.filter(u => ids[u.email]).map((u, i) => {
      const clientUsers = users.filter(x => x.role === "client");
      const clientIdx = clientUsers.indexOf(u as any);
      return {
        id: ids[u.email],
        email: u.email,
        full_name: u.full_name,
        phone: u.phone,
        role: u.role,
        admin_id: ["teacher", "staff", "client"].includes(u.role) ? adminId : null,
        teacher_id: u.role === "client" ? (clientIdx < 3 ? t1 : t2) : null,
        license_type: (u as any).license_type || null,
      };
    });

    const { error: pErr } = await supabaseAdmin.from("profiles").upsert(profiles, { onConflict: "id" });
    if (pErr) results.push(`Profile error: ${pErr.message}`);
    else results.push(`Inserted ${profiles.length} profiles`);

    // Training progress
    const clientProfiles = profiles.filter(p => p.role === "client");
    const scores = [
      { theory: 85, sim: 78, track: 82, road: 90, notes: "Học viên tiến bộ tốt" },
      { theory: 72, sim: 60, track: null, road: null, notes: "Cần luyện thêm mô phỏng" },
      { theory: 90, sim: 88, track: 75, road: null, notes: "Xuất sắc" },
      { theory: 65, sim: null, track: 58, road: null, notes: "Cần cải thiện sa hình" },
      { theory: 45, sim: 55, track: null, road: null, notes: "Mới bắt đầu" },
    ];

    const progressData = clientProfiles.map((c, i) => ({
      client_id: c.id,
      teacher_id: c.teacher_id!,
      theory_score: scores[i]?.theory ?? null,
      simulation_score: scores[i]?.sim ?? null,
      track_test_score: scores[i]?.track ?? null,
      road_test_score: scores[i]?.road ?? null,
      notes: scores[i]?.notes ?? "",
      schedule_milestones: [
        { date: "2026-03-01", title: "Học lý thuyết", completed: i < 4 },
        { date: "2026-03-15", title: "Thi thử lần 1", completed: i < 3 },
        { date: "2026-04-01", title: "Thi sa hình", completed: i < 2 },
        { date: "2026-04-15", title: "Thi đường trường", completed: i < 1 },
      ],
    }));

    // Delete existing progress first to avoid duplicates
    for (const p of progressData) {
      await supabaseAdmin.from("training_progress").delete().eq("client_id", p.client_id);
    }

    const { error: tErr } = await supabaseAdmin.from("training_progress").insert(progressData);
    if (tErr) results.push(`Progress error: ${tErr.message}`);
    else results.push(`Inserted ${progressData.length} training records`);

    // Some sample leads
    const { error: lErr } = await supabaseAdmin.from("contact_leads").insert([
      { name: "Nguyễn Văn A", phone: "0912345678", content: "Muốn học bằng B2", status: "new" },
      { name: "Trần Thị B", phone: "0923456789", content: "Hỏi học phí A1", status: "contacted" },
      { name: "Lê Văn C", phone: "0934567890", content: "Đăng ký học ô tô", status: "new" },
    ]);
    if (lErr) results.push(`Leads error: ${lErr.message}`);
    else results.push("Inserted 3 sample leads");

    return new Response(JSON.stringify({
      success: true,
      results,
      accounts: users.map(u => ({ email: u.email, password: u.password, role: u.role })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
