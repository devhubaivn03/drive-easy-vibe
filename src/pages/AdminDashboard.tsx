import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard, TableSkeleton, EmptyState } from "@/components/shared/StatCard";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Users, GraduationCap, UserPlus, LayoutDashboard, ClipboardList, MessageCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const navItems = [
  { label: "Tổng quan", path: "/admin", icon: <LayoutDashboard size={18} /> },
  { label: "Quản lý Staff", path: "/admin/staff", icon: <Users size={18} /> },
  { label: "Quản lý Giáo viên", path: "/admin/teachers", icon: <GraduationCap size={18} /> },
  { label: "Quản lý Học viên", path: "/admin/clients", icon: <Users size={18} /> },
  { label: "Lead liên hệ", path: "/admin/leads", icon: <ClipboardList size={18} /> },
  { label: "Hộp thư Chat", path: "/admin/chat", icon: <MessageCircle size={18} /> },
];

function UserManagementPage({
  title,
  role,
  fields,
}: {
  title: string;
  role: string;
  fields: { key: string; label: string; type?: string }[];
}) {
  const { profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    let query = supabase.from("profiles").select("*").eq("role", role as any);
    if (profile?.role === "admin") query = query.eq("admin_id", profile.id);
    const { data } = await query.order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  const fetchTeachers = async () => {
    if (role !== "client") return;
    let query = supabase.from("profiles").select("id, full_name").eq("role", "teacher");
    if (profile?.role === "admin") query = query.eq("admin_id", profile.id);
    const { data } = await query;
    setTeachers(data || []);
  };

  useEffect(() => { fetchUsers(); fetchTeachers(); }, [profile]);

  const handleCreate = async () => {
    if (!form.full_name || !form.email || !form.password) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }
    setSaving(true);
    const { error } = await supabase.functions.invoke("admin-create-user", {
      body: {
        ...form,
        role,
        admin_id: profile?.role === "admin" ? profile.id : profile?.admin_id,
        teacher_id: form.teacher_id || undefined,
      },
    });
    if (error) toast.error("Tạo thất bại: " + error.message);
    else {
      toast.success("Tạo thành công!");
      setDialogOpen(false);
      setForm({});
      fetchUsers();
    }
    setSaving(false);
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    const updates: any = {};
    fields.forEach((f) => { if (form[f.key] !== undefined) updates[f.key] = form[f.key]; });

    const { error } = await supabase.from("profiles").update(updates).eq("id", editUser.id);
    if (error) toast.error("Cập nhật thất bại");
    else {
      toast.success("Cập nhật thành công!");
      setEditUser(null);
      setForm({});
      fetchUsers();
    }
    setSaving(false);
  };

  const filtered = users.filter((u) =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  const formFields = (isEdit: boolean) => (
    <div className="space-y-4">
      {fields.map((f) => (
        <div key={f.key}>
          <Label>{f.label}</Label>
          {f.key === "teacher_id" ? (
            <Select value={form.teacher_id || ""} onValueChange={(v) => setForm({ ...form, teacher_id: v })}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Chọn giáo viên" /></SelectTrigger>
              <SelectContent>
                {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : f.key === "license_type" ? (
            <Select value={form.license_type || ""} onValueChange={(v) => setForm({ ...form, license_type: v })}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Chọn loại bằng" /></SelectTrigger>
              <SelectContent>
                {["A1","A2","B1","B2","C","D","E","F"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type={f.type || "text"}
              value={form[f.key] || ""}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="rounded-xl"
            />
          )}
        </div>
      ))}
      {!isEdit && (
        <>
          <div><Label>Email *</Label><Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl" /></div>
          <div><Label>Mật khẩu *</Label><Input type="password" value={form.password || ""} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-xl" /></div>
        </>
      )}
      <Button variant="hero" className="w-full rounded-xl" onClick={isEdit ? handleEdit : handleCreate} disabled={saving}>
        {saving ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo mới"}
      </Button>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setForm({}); }}>
          <DialogTrigger asChild>
            <Button variant="hero" className="rounded-xl"><UserPlus size={16} /> Tạo mới</Button>
          </DialogTrigger>
          <DialogContent className="glass-card max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Tạo {title.toLowerCase()}</DialogTitle></DialogHeader>
            {formFields(false)}
          </DialogContent>
        </Dialog>
      </div>

      <Input placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4 max-w-sm rounded-xl" />

      {loading ? <TableSkeleton /> : filtered.length === 0 ? (
        <EmptyState title="Chưa có dữ liệu" description="Tạo mới để bắt đầu" icon={<Users size={40} />} />
      ) : (
        <div className="glass-card rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 text-left">
              <th className="p-4 font-semibold text-muted-foreground">Họ tên</th>
              <th className="p-4 font-semibold text-muted-foreground">Email</th>
              <th className="p-4 font-semibold text-muted-foreground">SĐT</th>
              {role === "client" && <th className="p-4 font-semibold text-muted-foreground">Bằng lái</th>}
              <th className="p-4 font-semibold text-muted-foreground"></th>
            </tr></thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-foreground">{u.full_name}</td>
                  <td className="p-4 text-muted-foreground">{u.email}</td>
                  <td className="p-4 text-muted-foreground">{u.phone || "—"}</td>
                  {role === "client" && <td className="p-4"><span className="gradient-primary rounded-full px-2 py-0.5 text-xs font-semibold text-primary-foreground">{u.license_type || "—"}</span></td>}
                  <td className="p-4">
                    <Button variant="ghost" size="icon" onClick={() => {
                      setEditUser(u);
                      setForm({ full_name: u.full_name, phone: u.phone || "", license_type: u.license_type || "", teacher_id: u.teacher_id || "" });
                    }}>
                      <Pencil size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => { if (!o) { setEditUser(null); setForm({}); } }}>
        <DialogContent className="glass-card max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Chỉnh sửa thông tin</DialogTitle></DialogHeader>
          {formFields(true)}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ staff: 0, teachers: 0, clients: 0, leads: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const fetchStats = async () => {
      const [s, t, c, l] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "staff").eq("admin_id", profile.id),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "teacher").eq("admin_id", profile.id),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "client").eq("admin_id", profile.id),
        supabase.from("contact_leads").select("id", { count: "exact", head: true }).eq("status", "new"),
      ]);
      setStats({ staff: s.count || 0, teachers: t.count || 0, clients: c.count || 0, leads: l.count || 0 });
      setLoading(false);
    };
    fetchStats();
  }, [profile]);

  return (
    <DashboardLayout navItems={navItems} roleLabel="ADMIN" roleColor="bg-orange-500 text-primary-foreground">
      {loading ? <TableSkeleton rows={2} /> : (
        <>
          <h1 className="mb-6 text-2xl font-bold text-foreground">Tổng quan</h1>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<Users size={24} />} label="Nhân viên" value={stats.staff} />
            <StatCard icon={<GraduationCap size={24} />} label="Giáo viên" value={stats.teachers} colorClass="gradient-accent" />
            <StatCard icon={<Users size={24} />} label="Học viên" value={stats.clients} colorClass="gradient-secondary" />
            <StatCard icon={<ClipboardList size={24} />} label="Lead chờ" value={stats.leads} />
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export function AdminStaff() {
  return (
    <DashboardLayout navItems={navItems} roleLabel="ADMIN" roleColor="bg-orange-500 text-primary-foreground">
      <UserManagementPage
        title="Quản lý Staff"
        role="staff"
        fields={[
          { key: "full_name", label: "Họ tên *" },
          { key: "phone", label: "Số điện thoại" },
        ]}
      />
    </DashboardLayout>
  );
}

export function AdminTeachers() {
  return (
    <DashboardLayout navItems={navItems} roleLabel="ADMIN" roleColor="bg-orange-500 text-primary-foreground">
      <UserManagementPage
        title="Quản lý Giáo viên"
        role="teacher"
        fields={[
          { key: "full_name", label: "Họ tên *" },
          { key: "phone", label: "Số điện thoại" },
        ]}
      />
    </DashboardLayout>
  );
}

export function AdminClients() {
  return (
    <DashboardLayout navItems={navItems} roleLabel="ADMIN" roleColor="bg-orange-500 text-primary-foreground">
      <UserManagementPage
        title="Quản lý Học viên"
        role="client"
        fields={[
          { key: "full_name", label: "Họ tên *" },
          { key: "phone", label: "Số điện thoại" },
          { key: "license_type", label: "Loại bằng lái" },
          { key: "teacher_id", label: "Giáo viên phụ trách" },
        ]}
      />
    </DashboardLayout>
  );
}
