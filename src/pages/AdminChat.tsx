import { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAdminNav } from "@/hooks/useRoleNav";

export default function AdminChat() {
  const navItems = useAdminNav();
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

    const channel = supabase.channel("admin-chat-sessions")
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

    const channel = supabase.channel(`admin-msg-${activeSession.id}`)
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
    <DashboardLayout navItems={navItems} roleLabel="ADMIN" roleColor="bg-orange-500 text-primary-foreground">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Hộp thư Chat</h1>
      <div className="flex gap-4 h-[calc(100vh-200px)]">
        {/* Sessions list */}
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

        {/* Chat panel */}
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
