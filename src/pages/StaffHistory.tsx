import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TableSkeleton, EmptyState } from "@/components/shared/StatCard";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useAdminNav, useSuperadminNav } from "@/hooks/useRoleNav";
import { Archive, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  teacher: "Giáo viên",
  staff: "Nhân viên",
};

function StaffHistoryContent({ scope }: { scope: "admin" | "superadmin" }) {
  const { profile } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [deleters, setDeleters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const fetchData = async () => {
    setLoading(true);
    let q = supabase
      .from("profiles")
      .select("*")
      .neq("role", "client")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });
    if (scope === "admin" && profile?.id) q = q.eq("admin_id", profile.id);
    const { data } = await q;
    setRows(data || []);

    const ids = Array.from(new Set((data || []).map((r: any) => r.deleted_by).filter(Boolean)));
    if (ids.length) {
      const { data: peeps } = await supabase.from("profiles").select("id, full_name").in("id", ids as string[]);
      const map: Record<string, string> = {};
      (peeps || []).forEach((p: any) => { map[p.id] = p.full_name; });
      setDeleters(map);
    }
    setLoading(false);
  };

  useEffect(() => { if (profile) fetchData(); /* eslint-disable-next-line */ }, [profile]);

  const restore = async (id: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ deleted_at: null, deleted_reason: null, deleted_by: null } as any)
      .eq("id", id);
    if (error) return toast.error("Khôi phục thất bại");
    toast.success("Đã khôi phục tài khoản");
    fetchData();
  };

  const filtered = rows.filter((r) => {
    const matchSearch = !search ||
      r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.deleted_reason?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || r.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Lịch sử nhân viên</h1>
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1 min-w-56">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Tìm theo tên, email, lý do..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2 text-sm">
          <option value="">Tất cả vai trò</option>
          <option value="admin">Admin</option>
          <option value="teacher">Giáo viên</option>
          <option value="staff">Nhân viên</option>
          <option value="superadmin">Superadmin</option>
        </select>
      </div>
      {loading ? <TableSkeleton /> : filtered.length === 0 ? (
        <EmptyState title="Chưa có tài khoản bị xóa" description="Nhân viên/giáo viên/admin bị xóa mềm sẽ xuất hiện tại đây" icon={<Archive size={40} />} />
      ) : (
        <div className="glass-card rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left">
                <th className="p-4 font-semibold text-muted-foreground">Họ tên</th>
                <th className="p-4 font-semibold text-muted-foreground">Vai trò</th>
                <th className="p-4 font-semibold text-muted-foreground">Email</th>
                <th className="p-4 font-semibold text-muted-foreground">SĐT</th>
                <th className="p-4 font-semibold text-muted-foreground">Lý do xóa</th>
                <th className="p-4 font-semibold text-muted-foreground">Người xóa</th>
                <th className="p-4 font-semibold text-muted-foreground">Ngày xóa</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-foreground">{r.full_name}</td>
                  <td className="p-4 text-muted-foreground">{ROLE_LABELS[r.role] || r.role}</td>
                  <td className="p-4 text-muted-foreground">{r.email}</td>
                  <td className="p-4 text-muted-foreground">{r.phone || "—"}</td>
                  <td className="p-4 text-muted-foreground max-w-xs whitespace-pre-wrap">{r.deleted_reason || "—"}</td>
                  <td className="p-4 text-muted-foreground">{deleters[r.deleted_by] || "—"}</td>
                  <td className="p-4 text-muted-foreground text-xs">{r.deleted_at ? new Date(r.deleted_at).toLocaleString("vi-VN") : "—"}</td>
                  <td className="p-4">
                    <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => restore(r.id)} title="Khôi phục">
                      <RotateCcw size={14} /> Khôi phục
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function AdminStaffHistory() {
  const navItems = useAdminNav();
  return (
    <DashboardLayout navItems={navItems} roleLabel="ADMIN" roleColor="bg-orange-500 text-primary-foreground">
      <StaffHistoryContent scope="admin" />
    </DashboardLayout>
  );
}

export function SuperadminStaffHistory() {
  const navItems = useSuperadminNav();
  return (
    <DashboardLayout navItems={navItems} roleLabel="SUPERADMIN" roleColor="gradient-primary text-primary-foreground">
      <StaffHistoryContent scope="superadmin" />
    </DashboardLayout>
  );
}
