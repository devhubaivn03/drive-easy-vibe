import { useEffect, useState, useRef } from "react";
import { DashboardLayout, NavItem } from "@/components/DashboardLayout";
import { StatCard, TableSkeleton, EmptyState } from "@/components/shared/StatCard";
import { ChangeOwnPassword } from "@/components/shared/ChangeOwnPassword";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Users, ClipboardList, MessageCircle, LayoutDashboard, UserPlus, Pencil, Send, UserCheck, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ExamScoresDialogButton } from "@/components/shared/ExamScores";
import { ViewAsStudentDialogButton } from "@/components/shared/StudentClientView";

function useStaffNavBadges() {
  const [newLeads, setNewLeads] = useState(0);
  const [waitingChats, setWaitingChats] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const [l, c] = await Promise.all([
        supabase.from("contact_leads").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("chat_sessions").select("id", { count: "exact", head: true }).eq("status", "waiting"),
      ]);
      setNewLeads(l.count || 0);
      setWaitingChats(c.count || 0);
    };
    fetch();

    const ch1 = supabase.channel("staff-badge-leads")
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_leads" }, () => {
        supabase.from("contact_leads").select("id", { count: "exact", head: true }).eq("status", "new").then(({ count }) => setNewLeads(count || 0));
      }).subscribe();

    const ch2 = supabase.channel("staff-badge-chats")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_sessions" }, () => {
        supabase.from("chat_sessions").select("id", { count: "exact", head: true }).eq("status", "waiting").then(({ count }) => setWaitingChats(count || 0));
      }).subscribe();

    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, []);

  return { newLeads, waitingChats };
}

function useStaffNavItems(): NavItem[] {
  const { newLeads, waitingChats } = useStaffNavBadges();
  return [
    { label: "Tổng quan", path: "/staff", icon: <LayoutDashboard size={18} /> },
    { label: "Quản lý Học viên", path: "/staff/clients", icon: <Users size={18} /> },
    { label: "Lead liên hệ", path: "/staff/leads", icon: <ClipboardList size={18} />, badge: newLeads },
    { label: "Chat trực tuyến", path: "/staff/chat", icon: <MessageCircle size={18} />, badge: waitingChats },
    { label: "Cài đặt", path: "/staff/settings", icon: <Settings size={18} /> },
  ];
}

export default function StaffDashboard() {
  const navItems = useStaffNavItems();
  const { profile } = useAuth();
  const [stats, setStats] = useState({ clients: 0, leads: 0, chats: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const fetchStats = async () => {
      const [c, l, ch] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "client"),
        supabase.from("contact_leads").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("chat_sessions").select("id", { count: "exact", head: true }).eq("status", "waiting"),
      ]);
      setStats({ clients: c.count || 0, leads: l.count || 0, chats: ch.count || 0 });
      setLoading(false);
    };
    fetchStats();
  }, [profile]);

  return (
    <DashboardLayout navItems={navItems} roleLabel="STAFF" roleColor="bg-yellow-500 text-foreground">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Tổng quan</h1>
      {loading ? <TableSkeleton rows={2} /> : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={<Users size={24} />} label="Học viên" value={stats.clients} />
          <StatCard icon={<ClipboardList size={24} />} label="Lead mới" value={stats.leads} colorClass="gradient-secondary" />
          <StatCard icon={<MessageCircle size={24} />} label="Chat chờ" value={stats.chats} colorClass="gradient-accent" />
        </div>
      )}
    </DashboardLayout>
  );
}

export function StaffClients() {
  const navItems = useStaffNavItems();
  const { profile } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLicense, setFilterLicense] = useState("");
  const [filterTeacher, setFilterTeacher] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchClients = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("role", "client").order("created_at", { ascending: false });
    setClients(data || []);
    setLoading(false);
  };

  const fetchTeachers = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name").eq("role", "teacher");
    setTeachers(data || []);
  };

  useEffect(() => { fetchClients(); fetchTeachers(); }, []);

  const handleCreate = async () => {
    if (!form.full_name || !form.email || !form.password) { toast.error("Điền đầy đủ thông tin"); return; }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: { ...form, role: "client", admin_id: profile?.admin_id, teacher_id: form.teacher_id || undefined },
    });
    if (error) {
      toast.error("Tạo thất bại: " + error.message);
    } else if (data?.error) {
      toast.error("Tạo thất bại: " + data.error);
    } else {
      toast.success("Tạo thành công!");
      setDialogOpen(false);
      setForm({});
      fetchClients();
    }
    setSaving(false);
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name, phone: form.phone, license_type: (form.license_type || null) as any, teacher_id: form.teacher_id || null,
    }).eq("id", editUser.id);
    if (error) { toast.error("Cập nhật thất bại"); setSaving(false); return; }

    if (form.new_password) {
      const { data, error: pwErr } = await supabase.functions.invoke("admin-create-user", {
        body: { action: "update_user", user_id: editUser.id, new_password: form.new_password },
      });
      if (pwErr) toast.error("Đổi mật khẩu thất bại");
      else if (data?.error) toast.error("Đổi mật khẩu thất bại: " + data.error);
      else toast.success("Đã đổi mật khẩu!");
    }

    toast.success("Cập nhật thành công!");
    setEditUser(null); setForm({}); fetchClients();
    setSaving(false);
  };

  const filtered = clients.filter((c) => {
    const matchSearch = c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search);
    const matchLicense = !filterLicense || c.license_type === filterLicense;
    const matchTeacher = !filterTeacher || c.teacher_id === filterTeacher;
    return matchSearch && matchLicense && matchTeacher;
  });

  return (
    <DashboardLayout navItems={navItems} roleLabel="STAFF" roleColor="bg-yellow-500 text-foreground">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Quản lý Học viên</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setForm({}); }}>
          <DialogTrigger asChild><Button variant="hero" className="rounded-xl"><UserPlus size={16} /> Tạo Học viên</Button></DialogTrigger>
          <DialogContent className="glass-card max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Tạo học viên mới</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Họ tên *</Label><Input value={form.full_name || ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="rounded-xl" /></div>
              <div><Label>Email *</Label><Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl" /></div>
              <div><Label>Mật khẩu *</Label><Input type="password" value={form.password || ""} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-xl" /></div>
              <div><Label>SĐT</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl" /></div>
              <div><Label>Loại bằng lái</Label>
                <Select value={form.license_type || ""} onValueChange={(v) => setForm({ ...form, license_type: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Chọn" /></SelectTrigger>
                  <SelectContent>{["A1","A2","B1","B2","C","D","E","F"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Giáo viên</Label>
                <Select value={form.teacher_id || ""} onValueChange={(v) => setForm({ ...form, teacher_id: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Chọn giáo viên" /></SelectTrigger>
                  <SelectContent>{teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button variant="hero" className="w-full rounded-xl" onClick={handleCreate} disabled={saving}>{saving ? "Đang tạo..." : "Tạo học viên"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <Input placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs rounded-xl" />
        <Select value={filterLicense} onValueChange={setFilterLicense}>
          <SelectTrigger className="w-36 rounded-xl"><SelectValue placeholder="Loại bằng lái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {["A1","A2","B1","B2","C","D","E","F"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTeacher} onValueChange={setFilterTeacher}>
          <SelectTrigger className="w-44 rounded-xl"><SelectValue placeholder="Giáo viên" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả GV</SelectItem>
            {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? <TableSkeleton /> : filtered.length === 0 ? <EmptyState title="Chưa có học viên" description="Tạo mới để bắt đầu" icon={<Users size={40} />} /> : (
        <div className="glass-card rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 text-left">
              <th className="p-4 font-semibold text-muted-foreground">Họ tên</th>
              <th className="p-4 font-semibold text-muted-foreground">Email</th>
              <th className="p-4 font-semibold text-muted-foreground">SĐT</th>
              <th className="p-4 font-semibold text-muted-foreground">Bằng lái</th>
              <th className="p-4 font-semibold text-muted-foreground">Giáo viên</th>
              <th className="p-4"></th>
            </tr></thead>
            <tbody>{filtered.map((c) => (
              <tr key={c.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                <td className="p-4 font-medium text-foreground">{c.full_name}</td>
                <td className="p-4 text-muted-foreground">{c.email}</td>
                <td className="p-4 text-muted-foreground">{c.phone || "—"}</td>
                <td className="p-4"><span className="gradient-primary rounded-full px-2 py-0.5 text-xs font-semibold text-primary-foreground">{c.license_type || "—"}</span></td>
                <td className="p-4 text-muted-foreground">{teachers.find(t => t.id === c.teacher_id)?.full_name || "—"}</td>
                <td className="p-4">
                  <div className="flex gap-1">
                    <ExamScoresDialogButton clientId={c.id} clientName={c.full_name} userId={profile?.id || ""} />
                    <ViewAsStudentDialogButton clientId={c.id} clientName={c.full_name} />
                    <Button variant="ghost" size="icon" onClick={() => {
                      setEditUser(c);
                      setForm({ full_name: c.full_name, phone: c.phone || "", license_type: c.license_type || "", teacher_id: c.teacher_id || "" });
                    }}><Pencil size={16} /></Button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      <Dialog open={!!editUser} onOpenChange={(o) => { if (!o) { setEditUser(null); setForm({}); } }}>
        <DialogContent className="glass-card">
          <DialogHeader><DialogTitle>Chỉnh sửa học viên</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Họ tên</Label><Input value={form.full_name || ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="rounded-xl" /></div>
            <div><Label>SĐT</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl" /></div>
            <div><Label>Bằng lái</Label>
              <Select value={form.license_type || ""} onValueChange={(v) => setForm({ ...form, license_type: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{["A1","A2","B1","B2","C","D","E","F"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Giáo viên</Label>
              <Select value={form.teacher_id || ""} onValueChange={(v) => setForm({ ...form, teacher_id: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Đổi mật khẩu (tùy chọn)</Label><Input type="password" placeholder="Để trống nếu không đổi" value={form.new_password || ""} onChange={(e) => setForm({ ...form, new_password: e.target.value })} className="rounded-xl" /></div>
            <Button variant="hero" className="w-full rounded-xl" onClick={handleEdit} disabled={saving}>{saving ? "Đang lưu..." : "Cập nhật"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export function StaffLeads() {
  const navItems = useStaffNavItems();
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
      const { data } = await supabase.from("profiles").select("id, full_name").eq("role", "teacher");
      setTeachers(data || []);
    };
    fetchTeachers();

    const channel = supabase.channel("leads-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contact_leads" }, (payload) => {
        setLeads((prev) => [payload.new as any, ...prev]);
        toast.info("Lead mới vừa đến!");
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("contact_leads").update({ status: status as any }).eq("id", id);
    if (error) {
      toast.error("Cập nhật thất bại: " + error.message);
    } else {
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
      toast.success("Cập nhật trạng thái thành công!");
    }
  };

  const handleConvert = async () => {
    if (!convertLead || !convertForm.email || !convertForm.password) {
      toast.error("Vui lòng điền email và mật khẩu");
      return;
    }
    setConverting(true);
    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: {
        full_name: convertLead.name,
        phone: convertLead.phone,
        email: convertForm.email,
        password: convertForm.password,
        role: "client",
        admin_id: profile?.admin_id,
        teacher_id: convertForm.teacher_id || undefined,
        license_type: convertForm.license_type || undefined,
      },
    });
    if (error) {
      toast.error("Chuyển đổi thất bại: " + error.message);
    } else if (data?.error) {
      toast.error("Chuyển đổi thất bại: " + data.error);
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
    <DashboardLayout navItems={navItems} roleLabel="STAFF" roleColor="bg-yellow-500 text-foreground">
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

export function StaffChat() {
  const navItems = useStaffNavItems();
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      const { data } = await supabase.from("chat_sessions").select("*").in("status", ["waiting", "active"]).order("created_at", { ascending: false });
      setSessions(data || []);
    };
    fetchSessions();

    const channel = supabase.channel("staff-chat-sessions")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_sessions" }, () => fetchSessions())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!activeSession) return;
    const fetchMsgs = async () => {
      const { data } = await supabase.from("chat_messages").select("*").eq("session_id", activeSession.id).order("created_at", { ascending: true });
      setMessages(data || []);
    };
    fetchMsgs();

    const channel = supabase.channel(`msg-${activeSession.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `session_id=eq.${activeSession.id}` }, (payload) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === (payload.new as any).id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeSession]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const claimSession = async (session: any) => {
    await supabase.from("chat_sessions").update({ status: "active", claimed_by: profile?.id }).eq("id", session.id);
    setActiveSession({ ...session, status: "active", claimed_by: profile?.id });
  };

  const closeSession = async () => {
    if (!activeSession) return;
    await supabase.from("chat_sessions").update({ status: "closed" }).eq("id", activeSession.id);
    setActiveSession(null);
  };

  const sendMessage = async () => {
    if (!message.trim() || !activeSession) return;
    const content = message.trim();
    setMessage("");
    await supabase.from("chat_messages").insert({
      session_id: activeSession.id, sender_type: "staff", sender_id: profile?.id, content,
    });
  };

  return (
    <DashboardLayout navItems={navItems} roleLabel="STAFF" roleColor="bg-yellow-500 text-foreground">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Chat trực tuyến</h1>
      <div className="flex gap-4 h-[calc(100vh-200px)]">
        <div className="w-80 glass-card rounded-2xl overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-border/50 font-semibold text-foreground">Phiên chat ({sessions.length})</div>
          {sessions.map((s) => (
            <div key={s.id} onClick={() => setActiveSession(s)}
              className={cn("cursor-pointer border-b border-border/30 p-4 hover:bg-muted/30 transition-colors", activeSession?.id === s.id && "bg-muted/50")}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground text-sm">{s.visitor_name || "Khách ẩn danh"}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.status === "waiting" ? "gradient-secondary text-primary-foreground" : "gradient-accent text-accent-foreground"}`}>
                  {s.status === "waiting" ? "Chờ" : "Active"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{new Date(s.created_at).toLocaleString("vi-VN")}</p>
              {s.status === "waiting" && (
                <Button variant="accent" size="sm" className="mt-2 w-full rounded-xl text-xs" onClick={(e) => { e.stopPropagation(); claimSession(s); }}>
                  🟢 Nhận phiên
                </Button>
              )}
            </div>
          ))}
          {sessions.length === 0 && <p className="p-4 text-sm text-muted-foreground text-center">Chưa có phiên chat</p>}
        </div>

        <div className="flex-1 glass-card rounded-2xl flex flex-col">
          {activeSession ? (
            <>
              <div className="flex items-center justify-between border-b border-border/50 p-4">
                <div>
                  <p className="font-semibold text-foreground">{activeSession.visitor_name || "Khách ẩn danh"}</p>
                  <p className="text-xs text-muted-foreground">Phiên #{activeSession.id.slice(0, 8)}</p>
                </div>
                <Button variant="destructive" size="sm" className="rounded-xl" onClick={closeSession}>Đóng phiên</Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.sender_type === "staff" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-xs rounded-2xl px-4 py-2 text-sm", m.sender_type === "staff" ? "gradient-primary text-primary-foreground" : "bg-muted text-foreground")}>
                      {m.content}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="border-t border-border/50 p-4 flex gap-2">
                <Input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Nhập tin nhắn..." className="rounded-xl" />
                <Button variant="hero" size="icon" className="rounded-xl" onClick={sendMessage}><Send size={18} /></Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>Chọn một phiên chat để bắt đầu</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export function StaffSettings() {
  const navItems = useStaffNavItems();
  return (
    <DashboardLayout navItems={navItems} roleLabel="STAFF" roleColor="bg-yellow-500 text-foreground">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Cài đặt</h1>
      <ChangeOwnPassword />
    </DashboardLayout>
  );
}
