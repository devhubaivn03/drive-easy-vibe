import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TableSkeleton, EmptyState } from "@/components/shared/StatCard";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useAdminNav, useStaffNav, useSuperadminNav } from "@/hooks/useRoleNav";
import { Archive, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function ClientHistoryContent({ scope }: { scope: "admin" | "staff" | "superadmin" }) {
  const { profile } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [deleters, setDeleters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    let q = supabase
      .from("profiles")
      .select("*")
      .eq("role", "client")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });
    if (scope === "admin" && profile?.id) q = q.eq("admin_id", profile.id);
    else if (scope === "staff" && (profile as any)?.admin_id) q = q.eq("admin_id", (profile as any).admin_id);
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
    toast.success("Đã khôi phục học viên");
    fetchData();
  };

  const filtered = rows.filter((r) =>
    !search ||
    r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase()) ||
    r.deleted_reason?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Lịch sử học viên</h1>
      <div className="mb-4 relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Tìm theo tên, email, lý do..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl" />
      </div>
      {loading ? <TableSkeleton /> : filtered.length === 0 ? (
        <EmptyState title="Chưa có học viên bị xóa" description="Học viên bị xóa mềm sẽ xuất hiện tại đây" icon={<Archive size={40} />} />
      ) : (
        <div className="glass-card rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left">
                <th className="p-4 font-semibold text-muted-foreground">Họ tên</th>
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

export function AdminClientHistory() {
  const navItems = useAdminNav();
  return (
    <DashboardLayout navItems={navItems} roleLabel="ADMIN" roleColor="bg-orange-500 text-primary-foreground">
      <ClientHistoryContent scope="admin" />
    </DashboardLayout>
  );
}

export function StaffClientHistory() {
  const navItems = useStaffNav();
  return (
    <DashboardLayout navItems={navItems} roleLabel="STAFF" roleColor="bg-yellow-500 text-foreground">
      <ClientHistoryContent scope="staff" />
    </DashboardLayout>
  );
}

export function SuperadminClientHistory() {
  const navItems = useSuperadminNav();
  return (
    <DashboardLayout navItems={navItems} roleLabel="SUPERADMIN" roleColor="gradient-primary text-primary-foreground">
      <ClientHistoryContent scope="superadmin" />
    </DashboardLayout>
  );
}