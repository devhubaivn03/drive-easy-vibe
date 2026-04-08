import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TableSkeleton, EmptyState } from "@/components/shared/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, Users, GraduationCap, LayoutDashboard, MessageCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const navItems = [
  { label: "Tổng quan", path: "/admin", icon: <LayoutDashboard size={18} /> },
  { label: "Quản lý Staff", path: "/admin/staff", icon: <Users size={18} /> },
  { label: "Quản lý Giáo viên", path: "/admin/teachers", icon: <GraduationCap size={18} /> },
  { label: "Quản lý Học viên", path: "/admin/clients", icon: <Users size={18} /> },
  { label: "Lead liên hệ", path: "/admin/leads", icon: <ClipboardList size={18} /> },
  { label: "Hộp thư Chat", path: "/admin/chat", icon: <MessageCircle size={18} /> },
];

export default function AdminLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      const { data } = await supabase.from("contact_leads").select("*").order("created_at", { ascending: false });
      setLeads(data || []);
      setLoading(false);
    };
    fetchLeads();

    const channel = supabase.channel("admin-leads-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contact_leads" }, (payload) => {
        setLeads((prev) => [payload.new as any, ...prev]);
        toast.info("Lead mới vừa đến!");
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("contact_leads").update({ status: status as any }).eq("id", id);
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
    toast.success("Cập nhật trạng thái thành công!");
  };

  const statusBadge = (s: string) => {
    const c: Record<string, string> = { new: "gradient-secondary", contacted: "bg-yellow-500", converted: "gradient-accent" };
    const labels: Record<string, string> = { new: "Mới", contacted: "Đã liên hệ", converted: "Đã chuyển đổi" };
    return <span className={`${c[s]} rounded-full px-2 py-0.5 text-xs font-semibold text-primary-foreground`}>{labels[s]}</span>;
  };

  return (
    <DashboardLayout navItems={navItems} roleLabel="ADMIN" roleColor="bg-orange-500 text-primary-foreground">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Lead liên hệ</h1>
      {loading ? <TableSkeleton /> : leads.length === 0 ? <EmptyState title="Chưa có lead" description="Lead sẽ xuất hiện khi khách gửi form" icon={<ClipboardList size={40} />} /> : (
        <div className="glass-card rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 text-left">
              <th className="p-4 font-semibold text-muted-foreground">Tên</th>
              <th className="p-4 font-semibold text-muted-foreground">SĐT</th>
              <th className="p-4 font-semibold text-muted-foreground">Nội dung</th>
              <th className="p-4 font-semibold text-muted-foreground">Trạng thái</th>
              <th className="p-4 font-semibold text-muted-foreground">Ngày</th>
              <th className="p-4"></th>
            </tr></thead>
            <tbody>{leads.map((l) => (
              <tr key={l.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                <td className="p-4 font-medium text-foreground">{l.name}</td>
                <td className="p-4 text-muted-foreground">{l.phone}</td>
                <td className="p-4 text-muted-foreground max-w-xs truncate">{l.content || "—"}</td>
                <td className="p-4">{statusBadge(l.status)}</td>
                <td className="p-4 text-muted-foreground">{new Date(l.created_at).toLocaleDateString("vi-VN")}</td>
                <td className="p-4">
                  <Select value={l.status} onValueChange={(v) => updateStatus(l.id, v)}>
                    <SelectTrigger className="w-32 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Mới</SelectItem>
                      <SelectItem value="contacted">Đã liên hệ</SelectItem>
                      <SelectItem value="converted">Đã chuyển đổi</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
