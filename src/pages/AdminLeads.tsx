import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TableSkeleton, EmptyState } from "@/components/shared/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ClipboardList, Users, GraduationCap, LayoutDashboard, MessageCircle, UserCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const { profile } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [convertLead, setConvertLead] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [convertForm, setConvertForm] = useState<Record<string, string>>({});
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    const fetchLeads = async () => {
      const { data } = await supabase.from("contact_leads").select("*").order("created_at", { ascending: false });
      setLeads(data || []);
      setLoading(false);
    };
    fetchLeads();

    const fetchTeachers = async () => {
      let query = supabase.from("profiles").select("id, full_name").eq("role", "teacher");
      if (profile?.role === "admin") query = query.eq("admin_id", profile.id);
      const { data } = await query;
      setTeachers(data || []);
    };
    fetchTeachers();

    const channel = supabase.channel("admin-leads-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contact_leads" }, (payload) => {
        setLeads((prev) => [payload.new as any, ...prev]);
        toast.info("Lead mới vừa đến!");
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("contact_leads").update({ status: status as any }).eq("id", id);
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
    toast.success("Cập nhật trạng thái thành công!");
  };

  const handleConvert = async () => {
    if (!convertLead || !convertForm.email || !convertForm.password) {
      toast.error("Vui lòng điền email và mật khẩu");
      return;
    }
    setConverting(true);
    const { error } = await supabase.functions.invoke("admin-create-user", {
      body: {
        full_name: convertLead.name,
        phone: convertLead.phone,
        email: convertForm.email,
        password: convertForm.password,
        role: "client",
        admin_id: profile?.id,
        teacher_id: convertForm.teacher_id || undefined,
        license_type: convertForm.license_type || undefined,
      },
    });
    if (error) {
      toast.error("Chuyển đổi thất bại: " + error.message);
    } else {
      toast.success("Đã chuyển lead thành học viên!");
      await supabase.from("contact_leads").update({ status: "converted" as any }).eq("id", convertLead.id);
      setLeads((prev) => prev.map((l) => l.id === convertLead.id ? { ...l, status: "converted" } : l));
      setConvertLead(null);
      setConvertForm({});
    }
    setConverting(false);
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
                <td className="p-4 flex gap-2">
                  <Select value={l.status} onValueChange={(v) => updateStatus(l.id, v)}>
                    <SelectTrigger className="w-32 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Mới</SelectItem>
                      <SelectItem value="contacted">Đã liên hệ</SelectItem>
                      <SelectItem value="converted">Đã chuyển đổi</SelectItem>
                    </SelectContent>
                  </Select>
                  {l.status !== "converted" && (
                    <Button variant="accent" size="sm" className="rounded-xl" onClick={() => {
                      setConvertLead(l);
                      setConvertForm({ email: "", password: "" });
                    }}>
                      <UserCheck size={14} /> Chuyển HV
                    </Button>
                  )}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      <Dialog open={!!convertLead} onOpenChange={(o) => { if (!o) { setConvertLead(null); setConvertForm({}); } }}>
        <DialogContent className="glass-card">
          <DialogHeader><DialogTitle>Chuyển lead thành học viên</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="glass-card rounded-xl p-3 text-sm">
              <p className="text-foreground font-medium">{convertLead?.name}</p>
              <p className="text-muted-foreground">{convertLead?.phone}</p>
              {convertLead?.content && <p className="text-muted-foreground mt-1">{convertLead.content}</p>}
            </div>
            <div><Label>Email *</Label><Input type="email" value={convertForm.email || ""} onChange={(e) => setConvertForm({ ...convertForm, email: e.target.value })} className="rounded-xl" /></div>
            <div><Label>Mật khẩu *</Label><Input type="password" value={convertForm.password || ""} onChange={(e) => setConvertForm({ ...convertForm, password: e.target.value })} className="rounded-xl" /></div>
            <div><Label>Loại bằng lái</Label>
              <Select value={convertForm.license_type || ""} onValueChange={(v) => setConvertForm({ ...convertForm, license_type: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Chọn" /></SelectTrigger>
                <SelectContent>{["A1","A2","B1","B2","C","D","E","F"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Giáo viên phụ trách</Label>
              <Select value={convertForm.teacher_id || ""} onValueChange={(v) => setConvertForm({ ...convertForm, teacher_id: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Chọn giáo viên" /></SelectTrigger>
                <SelectContent>{teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button variant="hero" className="w-full rounded-xl" onClick={handleConvert} disabled={converting}>
              {converting ? "Đang chuyển đổi..." : "Chuyển thành học viên"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
