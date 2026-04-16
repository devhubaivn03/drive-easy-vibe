import { useEffect, useState, useRef } from "react";
import { DashboardLayout, NavItem } from "@/components/DashboardLayout";
import { StatCard, TableSkeleton, EmptyState } from "@/components/shared/StatCard";
import { ChangeOwnPassword } from "@/components/shared/ChangeOwnPassword";
import { supabase } from "@/lib/supabase";
import { Users, GraduationCap, UserPlus, ClipboardList, Settings, LayoutDashboard, Pencil, KeyRound, MessageCircle, UserCheck, Send, BookOpenCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

function useNavBadges() {
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

    const ch1 = supabase.channel("badge-leads")
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_leads" }, () => {
        supabase.from("contact_leads").select("id", { count: "exact", head: true }).eq("status", "new").then(({ count }) => setNewLeads(count || 0));
      }).subscribe();

    const ch2 = supabase.channel("badge-chats")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_sessions" }, () => {
        supabase.from("chat_sessions").select("id", { count: "exact", head: true }).eq("status", "waiting").then(({ count }) => setWaitingChats(count || 0));
      }).subscribe();

    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, []);

  return { newLeads, waitingChats };
}

function useNavItems(): NavItem[] {
  const { newLeads, waitingChats } = useNavBadges();
  return [
    { label: "Tổng quan", path: "/superadmin", icon: <LayoutDashboard size={18} /> },
    { label: "Tất cả người dùng", path: "/superadmin/users", icon: <GraduationCap size={18} /> },
    { label: "Lead liên hệ", path: "/superadmin/leads", icon: <ClipboardList size={18} />, badge: newLeads },
    { label: "Hộp thư Chat", path: "/superadmin/chat", icon: <MessageCircle size={18} />, badge: waitingChats },
    { label: "Nội dung Trang chủ", path: "/superadmin/site-content", icon: <Pencil size={18} /> },
    { label: "Quản lý Câu hỏi", path: "/superadmin/questions", icon: <BookOpenCheck size={18} /> },
    { label: "Cài đặt", path: "/superadmin/settings", icon: <Settings size={18} /> },
  ];
}

export default function SuperadminDashboard() {
  const navItems = useNavItems();
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

export function SuperadminUsers() {
  const navItems = useNavItems();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [editUser, setEditUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", phone: "", role: "", license_type: "" });
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [passwordDialogUser, setPasswordDialogUser] = useState<any>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const openEdit = (user: any) => {
    setEditUser(user);
    setEditForm({
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "client",
      license_type: user.license_type || "",
    });
  };

  const saveProfile = async () => {
    if (!editUser) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: editForm.full_name,
      phone: editForm.phone || null,
      role: editForm.role as any,
      license_type: (editForm.license_type || null) as any,
    }).eq("id", editUser.id);

    if (error) {
      toast.error("Lưu thất bại: " + error.message);
    } else {
      toast.success("Cập nhật thành công!");
      setEditUser(null);
      fetchUsers();
    }
    setSaving(false);
  };

  const changePassword = async () => {
    if (!passwordDialogUser || !newPassword) return;
    if (newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    setChangingPassword(true);
    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: { action: "update_user", user_id: passwordDialogUser.id, new_password: newPassword },
    });
    if (error) {
      toast.error("Đổi mật khẩu thất bại: " + error.message);
    } else if (data?.error) {
      toast.error("Đổi mật khẩu thất bại: " + data.error);
    } else {
      toast.success("Đổi mật khẩu thành công!");
      setPasswordDialogUser(null);
      setNewPassword("");
    }
    setChangingPassword(false);
  };

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
              <th className="p-4 font-semibold text-muted-foreground">Hành động</th>
            </tr></thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-foreground">{u.full_name}</td>
                  <td className="p-4 text-muted-foreground">{u.email}</td>
                  <td className="p-4">{roleBadge(u.role)}</td>
                  <td className="p-4 text-muted-foreground">{u.phone || "—"}</td>
                  <td className="p-4 flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={() => openEdit(u)}>
                      <Pencil size={14} /> Sửa
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={() => { setPasswordDialogUser(u); setNewPassword(""); }}>
                      <KeyRound size={14} /> MK
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
            <DialogDescription>Cập nhật thông tin profile của người dùng</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Họ tên</Label><Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} className="rounded-xl" /></div>
            <div><Label>Email (không thể đổi)</Label><Input value={editForm.email} disabled className="rounded-xl opacity-60" /></div>
            <div><Label>Số điện thoại</Label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="rounded-xl" /></div>
            <div>
              <Label>Vai trò</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="superadmin">Superadmin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Giáo viên</SelectItem>
                  <SelectItem value="staff">Nhân viên</SelectItem>
                  <SelectItem value="client">Học viên</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Loại bằng</Label>
              <Select value={editForm.license_type || "none"} onValueChange={(v) => setEditForm({ ...editForm, license_type: v === "none" ? "" : v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có</SelectItem>
                  {["A1","A2","B1","B2","C","D","E","F"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="hero" className="w-full rounded-xl" onClick={saveProfile} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!passwordDialogUser} onOpenChange={(open) => !open && setPasswordDialogUser(null)}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu — {passwordDialogUser?.full_name}</DialogTitle>
            <DialogDescription>Nhập mật khẩu mới cho người dùng</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Mật khẩu mới</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Tối thiểu 6 ký tự" className="rounded-xl" /></div>
            <Button variant="hero" className="w-full rounded-xl" onClick={changePassword} disabled={changingPassword}>
              {changingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export function SuperadminLeads() {
  const navItems = useNavItems();
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

    const channel = supabase.channel("superadmin-leads-realtime")
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
    <DashboardLayout navItems={navItems} roleLabel="SUPERADMIN" roleColor="gradient-primary text-primary-foreground">
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
          <DialogHeader>
            <DialogTitle>Chuyển lead thành học viên</DialogTitle>
            <DialogDescription>Tạo tài khoản học viên từ thông tin lead</DialogDescription>
          </DialogHeader>
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

export function SuperadminChat() {
  const navItems = useNavItems();
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

    const channel = supabase.channel("superadmin-chat-sessions")
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

    const channel = supabase.channel(`superadmin-msg-${activeSession.id}`)
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
    <DashboardLayout navItems={navItems} roleLabel="SUPERADMIN" roleColor="gradient-primary text-primary-foreground">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Hộp thư Chat</h1>
      <div className="flex gap-4 h-[calc(100vh-200px)]">
        <div className="w-80 glass-card rounded-2xl overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-border/50 font-semibold text-foreground">Phiên chat ({sessions.length})</div>
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => setActiveSession(s)}
              className={cn(
                "cursor-pointer border-b border-border/30 p-4 hover:bg-muted/30 transition-colors",
                activeSession?.id === s.id && "bg-muted/50"
              )}
            >
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
                    <div className={cn(
                      "max-w-xs rounded-2xl px-4 py-2 text-sm",
                      m.sender_type === "staff" ? "gradient-primary text-primary-foreground" : "bg-muted text-foreground"
                    )}>
                      {m.content}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-border/50 p-4 flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Nhập tin nhắn..."
                  className="rounded-xl"
                />
                <Button variant="hero" size="icon" className="rounded-xl" onClick={sendMessage}>
                  <Send size={18} />
                </Button>
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

export function SuperadminSettings() {
  const navItems = useNavItems();
  return (
    <DashboardLayout navItems={navItems} roleLabel="SUPERADMIN" roleColor="gradient-primary text-primary-foreground">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Cài đặt</h1>
      <ChangeOwnPassword />
    </DashboardLayout>
  );
}
