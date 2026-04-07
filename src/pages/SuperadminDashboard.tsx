import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard, TableSkeleton, EmptyState } from "@/components/shared/StatCard";
import { supabase } from "@/lib/supabase";
import { Users, GraduationCap, UserPlus, ClipboardList, Settings, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const navItems = [
  { label: "Tổng quan", path: "/superadmin", icon: <LayoutDashboard size={18} /> },
  { label: "Quản lý Admin", path: "/superadmin/admins", icon: <Users size={18} /> },
  { label: "Tất cả người dùng", path: "/superadmin/users", icon: <GraduationCap size={18} /> },
  { label: "Cài đặt", path: "/superadmin/settings", icon: <Settings size={18} /> },
];

export default function SuperadminDashboard() {
  return (
    <DashboardLayout navItems={navItems} roleLabel="SUPERADMIN" roleColor="gradient-primary text-primary-foreground">
      <SuperadminOverview />
    </DashboardLayout>
  );
}

function SuperadminOverview() {
  const [stats, setStats] = useState({ admins: 0, teachers: 0, staff: 0, clients: 0, leads: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [admins, teachers, staff, clients, leads] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "teacher"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "staff"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "client"),
        supabase.from("contact_leads").select("id", { count: "exact", head: true }).eq("status", "new"),
      ]);
      setStats({
        admins: admins.count || 0,
        teachers: teachers.count || 0,
        staff: staff.count || 0,
        clients: clients.count || 0,
        leads: leads.count || 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <TableSkeleton rows={4} />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Tổng quan hệ thống</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard icon={<Users size={24} />} label="Admin" value={stats.admins} />
        <StatCard icon={<GraduationCap size={24} />} label="Giáo viên" value={stats.teachers} colorClass="gradient-accent" />
        <StatCard icon={<Users size={24} />} label="Nhân viên" value={stats.staff} colorClass="gradient-secondary" />
        <StatCard icon={<Users size={24} />} label="Học viên" value={stats.clients} />
        <StatCard icon={<ClipboardList size={24} />} label="Lead chờ" value={stats.leads} colorClass="gradient-secondary" />
      </div>
    </div>
  );
}

export function SuperadminAdmins() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "" });
  const [creating, setCreating] = useState(false);

  const fetchAdmins = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("role", "admin").order("created_at", { ascending: false });
    setAdmins(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAdmins(); }, []);

  const createAdmin = async () => {
    if (!form.full_name || !form.email || !form.password) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    setCreating(true);

    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: { ...form, role: "admin" },
    });

    if (error) {
      toast.error("Tạo admin thất bại: " + error.message);
    } else {
      toast.success("Tạo admin thành công!");
      setDialogOpen(false);
      setForm({ full_name: "", email: "", password: "", phone: "" });
      fetchAdmins();
    }
    setCreating(false);
  };

  const filtered = admins.filter((a) =>
    a.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout navItems={navItems} roleLabel="SUPERADMIN" roleColor="gradient-primary text-primary-foreground">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Quản lý Admin</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" className="rounded-xl"><UserPlus size={16} /> Tạo Admin</Button>
          </DialogTrigger>
          <DialogContent className="glass-card">
            <DialogHeader><DialogTitle>Tạo tài khoản Admin</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Họ tên *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="rounded-xl" /></div>
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl" /></div>
              <div><Label>Mật khẩu *</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-xl" /></div>
              <div><Label>Số điện thoại</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl" /></div>
              <Button variant="hero" className="w-full rounded-xl" onClick={createAdmin} disabled={creating}>
                {creating ? "Đang tạo..." : "Tạo Admin"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Input placeholder="Tìm kiếm admin..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4 max-w-sm rounded-xl" />

      {loading ? <TableSkeleton /> : filtered.length === 0 ? (
        <EmptyState title="Chưa có admin" description="Tạo admin đầu tiên" icon={<Users size={40} />} />
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 text-left">
              <th className="p-4 font-semibold text-muted-foreground">Họ tên</th>
              <th className="p-4 font-semibold text-muted-foreground">Email</th>
              <th className="p-4 font-semibold text-muted-foreground">SĐT</th>
              <th className="p-4 font-semibold text-muted-foreground">Ngày tạo</th>
            </tr></thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-foreground">{a.full_name}</td>
                  <td className="p-4 text-muted-foreground">{a.email}</td>
                  <td className="p-4 text-muted-foreground">{a.phone || "—"}</td>
                  <td className="p-4 text-muted-foreground">{new Date(a.created_at).toLocaleDateString("vi-VN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}

export function SuperadminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      setUsers(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      superadmin: "gradient-primary",
      admin: "bg-orange-500",
      teacher: "bg-green-500",
      staff: "bg-yellow-500",
      client: "bg-blue-500",
    };
    return <span className={`${colors[role] || "bg-muted"} rounded-full px-2 py-0.5 text-xs font-semibold text-primary-foreground`}>{role}</span>;
  };

  return (
    <DashboardLayout navItems={navItems} roleLabel="SUPERADMIN" roleColor="gradient-primary text-primary-foreground">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Tất cả người dùng</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <Input placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs rounded-xl" />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2 text-sm">
          <option value="">Tất cả role</option>
          <option value="superadmin">Superadmin</option>
          <option value="admin">Admin</option>
          <option value="teacher">Giáo viên</option>
          <option value="staff">Nhân viên</option>
          <option value="client">Học viên</option>
        </select>
      </div>

      {loading ? <TableSkeleton /> : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 text-left">
              <th className="p-4 font-semibold text-muted-foreground">Họ tên</th>
              <th className="p-4 font-semibold text-muted-foreground">Email</th>
              <th className="p-4 font-semibold text-muted-foreground">Role</th>
              <th className="p-4 font-semibold text-muted-foreground">SĐT</th>
            </tr></thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-foreground">{u.full_name}</td>
                  <td className="p-4 text-muted-foreground">{u.email}</td>
                  <td className="p-4">{roleBadge(u.role)}</td>
                  <td className="p-4 text-muted-foreground">{u.phone || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}

export function SuperadminSettings() {
  return (
    <DashboardLayout navItems={navItems} roleLabel="SUPERADMIN" roleColor="gradient-primary text-primary-foreground">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Cài đặt hệ thống</h1>
      <div className="glass-card rounded-2xl p-8 text-center">
        <Settings size={48} className="mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Tính năng đang được phát triển</p>
      </div>
    </DashboardLayout>
  );
}
