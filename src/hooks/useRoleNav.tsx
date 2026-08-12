import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { NavItem } from "@/components/DashboardLayout";
import { LayoutDashboard, Users, GraduationCap, ClipboardList, MessageCircle, Settings, MessagesSquare, Pencil, BookOpenCheck, Archive, Network, Building2, BookOpen, FileText, Bell } from "lucide-react";

function useChatBadges() {
  const [newLeads, setNewLeads] = useState(0);
  const [waitingChats, setWaitingChats] = useState(0);
  const [studentMsgs, setStudentMsgs] = useState(0);
  const [internalMsgs, setInternalMsgs] = useState(0);
  const { profile } = useAuth();

  useEffect(() => {
    const fetch = async () => {
      const [l, c, sc] = await Promise.all([
        supabase.from("contact_leads").select("id", { count: "exact" }).eq("status", "new"),
        supabase.from("chat_sessions").select("id", { count: "exact" }).eq("status", "waiting"),
        supabase.from("client_chats").select("id", { count: "exact" }).eq("status", "waiting"),
      ]);
      setNewLeads(l.count || 0);
      setWaitingChats(c.count || 0);
      setStudentMsgs(sc.count || 0);

      // Unread internal chats (last message newer than my last read)
      if (profile?.id) {
        const { data: ic } = await supabase
          .from("internal_chats")
          .select("user_a, user_b, last_message_at, last_read_a, last_read_b")
          .or(`user_a.eq.${profile.id},user_b.eq.${profile.id}`);
        const unread = (ic || []).filter((c: any) => {
          const myRead = c.user_a === profile.id ? c.last_read_a : c.last_read_b;
          return !!c.last_message_at && (!myRead || new Date(c.last_message_at) > new Date(myRead));
        }).length;
        setInternalMsgs(unread);
      }
    };
    fetch();
    const ch = supabase.channel("role-nav-badges")
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_leads" }, fetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_sessions" }, fetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "client_chats" }, fetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "internal_chats" }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile?.id]);

  return { newLeads, waitingChats, studentMsgs, internalMsgs };
}

type Badges = ReturnType<typeof useChatBadges>;

function adminItems({ newLeads, waitingChats, studentMsgs, internalMsgs }: Badges): NavItem[] {
  return [
    { label: "Tổng quan", path: "/admin", icon: <LayoutDashboard size={18} /> },
    { label: "Quản lý Staff", path: "/admin/staff", icon: <Users size={18} /> },
    { label: "Quản lý Giáo viên", path: "/admin/teachers", icon: <GraduationCap size={18} /> },
    { label: "Quản lý Học viên", path: "/admin/clients", icon: <Users size={18} /> },
    { label: "Lịch sử học viên", path: "/admin/client-history", icon: <Archive size={18} /> },
    { label: "Lịch sử nhân viên", path: "/admin/staff-history", icon: <Archive size={18} /> },
    { label: "Lead liên hệ", path: "/admin/leads", icon: <ClipboardList size={18} />, badge: newLeads },
    { label: "Hộp thư Chat", path: "/admin/chat", icon: <MessageCircle size={18} />, badge: waitingChats },
    { label: "Chat với học viên", path: "/admin/student-chat", icon: <MessagesSquare size={18} />, badge: studentMsgs },
    { label: "Chat nội bộ", path: "/admin/internal-chat", icon: <Network size={18} />, badge: internalMsgs },
    { label: "Nội dung Trang chủ", path: "/admin/site-content", icon: <Pencil size={18} /> },
    { label: "Cài đặt", path: "/admin/settings", icon: <Settings size={18} /> },
  ];
}

function staffItems({ newLeads, waitingChats, studentMsgs, internalMsgs }: Badges): NavItem[] {
  return [
    { label: "Tổng quan", path: "/staff", icon: <LayoutDashboard size={18} /> },
    { label: "Quản lý Học viên", path: "/staff/clients", icon: <Users size={18} /> },
    { label: "Lịch sử học viên", path: "/staff/client-history", icon: <Archive size={18} /> },
    { label: "Lead liên hệ", path: "/staff/leads", icon: <ClipboardList size={18} />, badge: newLeads },
    { label: "Chat trực tuyến", path: "/staff/chat", icon: <MessageCircle size={18} />, badge: waitingChats },
    { label: "Chat với học viên", path: "/staff/student-chat", icon: <MessagesSquare size={18} />, badge: studentMsgs },
    { label: "Chat nội bộ", path: "/staff/internal-chat", icon: <Network size={18} />, badge: internalMsgs },
    { label: "Cài đặt", path: "/staff/settings", icon: <Settings size={18} /> },
  ];
}

function teacherItems({ internalMsgs }: Badges): NavItem[] {
  return [
    { label: "Học viên của tôi", path: "/teacher", icon: <LayoutDashboard size={18} /> },
    { label: "Chat với học viên", path: "/teacher/student-chat", icon: <MessagesSquare size={18} /> },
    { label: "Chat nội bộ", path: "/teacher/internal-chat", icon: <Network size={18} />, badge: internalMsgs },
    { label: "Cài đặt", path: "/teacher/settings", icon: <Settings size={18} /> },
  ];
}

function superadminItems({ newLeads, waitingChats, internalMsgs }: Badges): NavItem[] {
  return [
    { label: "Tổng quan", path: "/superadmin", icon: <LayoutDashboard size={18} /> },
    { label: "Tất cả người dùng", path: "/superadmin/users", icon: <GraduationCap size={18} /> },
    { label: "Quản lý Chi nhánh", path: "/superadmin/branches", icon: <Building2 size={18} /> },
    { label: "Lịch sử học viên", path: "/superadmin/client-history", icon: <Archive size={18} /> },
    { label: "Lịch sử nhân viên", path: "/superadmin/staff-history", icon: <Archive size={18} /> },
    { label: "Lead liên hệ", path: "/superadmin/leads", icon: <ClipboardList size={18} />, badge: newLeads },
    { label: "Hộp thư Chat", path: "/superadmin/chat", icon: <MessageCircle size={18} />, badge: waitingChats },
    { label: "Nội dung Trang chủ", path: "/superadmin/site-content", icon: <Pencil size={18} /> },
    { label: "Quản lý Câu hỏi", path: "/superadmin/questions", icon: <BookOpenCheck size={18} /> },
    { label: "Chat nội bộ", path: "/superadmin/internal-chat", icon: <Network size={18} />, badge: internalMsgs },
    { label: "Cài đặt", path: "/superadmin/settings", icon: <Settings size={18} /> },
  ];
}

export function useAdminNav(): NavItem[] { return adminItems(useChatBadges()); }
export function useStaffNav(): NavItem[] { return staffItems(useChatBadges()); }
export function useTeacherNav(): NavItem[] { return teacherItems(useChatBadges()); }
export function useSuperadminNav(): NavItem[] { return superadminItems(useChatBadges()); }

/** Sidebar tương ứng vai trò của người dùng đang đăng nhập */
export function useCurrentRoleNav(): NavItem[] {
  const { profile } = useAuth();
  const badges = useChatBadges();
  switch (profile?.role) {
    case "superadmin": return superadminItems(badges);
    case "admin": return adminItems(badges);
    case "staff": return staffItems(badges);
    case "teacher": return teacherItems(badges);
    case "client": return CLIENT_NAV;
    default: return [];
  }
}

export const CLIENT_NAV: NavItem[] = [
  { label: "Dashboard", path: "/client", icon: <LayoutDashboard size={18} /> },
  { label: "Ôn tập", path: "/client/practice", icon: <BookOpen size={18} /> },
  { label: "Thi thử", path: "/client/exam", icon: <FileText size={18} /> },
  { label: "Chat với GV", path: "/client/chat-teacher", icon: <MessagesSquare size={18} /> },
  { label: "Chat với nhân viên", path: "/client/chat-staff", icon: <Users size={18} /> },
  { label: "Thông báo", path: "/client/notifications", icon: <Bell size={18} /> },
  { label: "Cài đặt", path: "/client/settings", icon: <Settings size={18} /> },
];

export function useClientNav(): NavItem[] {
  return CLIENT_NAV;
}