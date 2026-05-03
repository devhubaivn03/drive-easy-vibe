import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { NavItem } from "@/components/DashboardLayout";
import { LayoutDashboard, Users, GraduationCap, ClipboardList, MessageCircle, Settings, MessagesSquare, Pencil, BookOpenCheck } from "lucide-react";

function useChatBadges() {
  const [newLeads, setNewLeads] = useState(0);
  const [waitingChats, setWaitingChats] = useState(0);
  const [studentMsgs, setStudentMsgs] = useState(0);
  const { profile } = useAuth();

  useEffect(() => {
    const fetch = async () => {
      const [l, c, sc] = await Promise.all([
        supabase.from("contact_leads").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("chat_sessions").select("id", { count: "exact", head: true }).eq("status", "waiting"),
        supabase.from("client_chats").select("id", { count: "exact", head: true }).eq("status", "waiting"),
      ]);
      setNewLeads(l.count || 0);
      setWaitingChats(c.count || 0);
      setStudentMsgs(sc.count || 0);
    };
    fetch();
    const ch = supabase.channel("role-nav-badges")
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_leads" }, fetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_sessions" }, fetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "client_chats" }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile?.id]);

  return { newLeads, waitingChats, studentMsgs };
}

export function useAdminNav(): NavItem[] {
  const { newLeads, waitingChats, studentMsgs } = useChatBadges();
  return [
    { label: "Tổng quan", path: "/admin", icon: <LayoutDashboard size={18} /> },
    { label: "Quản lý Staff", path: "/admin/staff", icon: <Users size={18} /> },
    { label: "Quản lý Giáo viên", path: "/admin/teachers", icon: <GraduationCap size={18} /> },
    { label: "Quản lý Học viên", path: "/admin/clients", icon: <Users size={18} /> },
    { label: "Lead liên hệ", path: "/admin/leads", icon: <ClipboardList size={18} />, badge: newLeads },
    { label: "Hộp thư Chat", path: "/admin/chat", icon: <MessageCircle size={18} />, badge: waitingChats },
    { label: "Chat với học viên", path: "/admin/student-chat", icon: <MessagesSquare size={18} />, badge: studentMsgs },
    { label: "Cài đặt", path: "/admin/settings", icon: <Settings size={18} /> },
  ];
}

export function useStaffNav(): NavItem[] {
  const { newLeads, waitingChats, studentMsgs } = useChatBadges();
  return [
    { label: "Tổng quan", path: "/staff", icon: <LayoutDashboard size={18} /> },
    { label: "Quản lý Học viên", path: "/staff/clients", icon: <Users size={18} /> },
    { label: "Lead liên hệ", path: "/staff/leads", icon: <ClipboardList size={18} />, badge: newLeads },
    { label: "Chat trực tuyến", path: "/staff/chat", icon: <MessageCircle size={18} />, badge: waitingChats },
    { label: "Chat với học viên", path: "/staff/student-chat", icon: <MessagesSquare size={18} />, badge: studentMsgs },
    { label: "Cài đặt", path: "/staff/settings", icon: <Settings size={18} /> },
  ];
}

export function useTeacherNav(): NavItem[] {
  return [
    { label: "Học viên của tôi", path: "/teacher", icon: <LayoutDashboard size={18} /> },
    { label: "Chat với học viên", path: "/teacher/student-chat", icon: <MessagesSquare size={18} /> },
    { label: "Cài đặt", path: "/teacher/settings", icon: <Settings size={18} /> },
  ];
}

export function useSuperadminNav(): NavItem[] {
  const { newLeads, waitingChats } = useChatBadges();
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