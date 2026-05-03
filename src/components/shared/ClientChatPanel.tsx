import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  /** Limit shown students. If omitted, all accessible by RLS are shown. */
  scope: "teacher" | "staff" | "admin" | "superadmin";
}

export function ClientChatPanel({ scope }: Props) {
  const { profile } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [chats, setChats] = useState<Record<string, any>>({});
  const [activeStudent, setActiveStudent] = useState<any | null>(null);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load students according to scope
  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      let q = supabase.from("profiles").select("id, full_name, email, avatar_url").eq("role", "client");
      if (scope === "teacher") q = q.eq("teacher_id", profile.id);
      else if (scope === "admin") q = q.eq("admin_id", profile.id);
      else if (scope === "staff") q = q.eq("admin_id", (profile as any).admin_id);
      const { data } = await q.order("full_name");
      setStudents(data || []);

      const ids = (data || []).map((s) => s.id);
      if (ids.length) {
        const { data: cc } = await supabase.from("client_chats").select("*").in("client_id", ids);
        const map: Record<string, any> = {};
        (cc || []).forEach((c) => { map[c.client_id] = c; });
        setChats(map);
      }
    };
    load();
  }, [profile, scope]);

  // Realtime new chats / status updates
  useEffect(() => {
    const ch = supabase.channel("client-chats-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "client_chats" }, (payload) => {
        const row: any = payload.new || payload.old;
        if (!row) return;
        setChats((prev) => ({ ...prev, [row.client_id]: payload.new || prev[row.client_id] }));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Load messages when active changes
  useEffect(() => {
    if (!activeChat) { setMessages([]); return; }
    supabase.from("client_chat_messages").select("*").eq("chat_id", activeChat.id).order("created_at")
      .then(({ data }) => setMessages(data || []));

    const ch = supabase.channel(`ccm-${activeChat.id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "client_chat_messages", filter: `chat_id=eq.${activeChat.id}` },
        (payload) => {
          setMessages((prev) => prev.some((m) => m.id === (payload.new as any).id) ? prev : [...prev, payload.new]);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeChat]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const openStudent = async (s: any) => {
    setActiveStudent(s);
    let chat = chats[s.id];
    if (!chat) {
      const { data, error } = await supabase
        .from("client_chats")
        .insert({ client_id: s.id, claimed_by: profile?.id, status: "active" })
        .select().single();
      if (error) { toast.error("Không tạo được phiên chat"); return; }
      chat = data;
      setChats((p) => ({ ...p, [s.id]: chat }));
    }
    setActiveChat(chat);
  };

  const claim = async () => {
    if (!activeChat || !profile) return;
    const { data } = await supabase.from("client_chats").update({ claimed_by: profile.id, status: "active" })
      .eq("id", activeChat.id).select().single();
    if (data) { setActiveChat(data); setChats((p) => ({ ...p, [data.client_id]: data })); }
  };

  const send = async () => {
    if (!text.trim() || !activeChat || !profile) return;
    const content = text.trim();
    setText("");
    await supabase.from("client_chat_messages").insert({
      chat_id: activeChat.id, sender_id: profile.id, sender_role: profile.role as any, content,
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-220px)]">
      <div className="md:w-72 glass-card rounded-2xl overflow-y-auto flex-shrink-0">
        <div className="p-3 border-b border-border/50 font-semibold text-foreground text-sm">
          Học viên ({students.length})
        </div>
        {students.length === 0 && <p className="p-4 text-sm text-muted-foreground text-center">Chưa có học viên</p>}
        {students.map((s) => {
          const c = chats[s.id];
          return (
            <button key={s.id} onClick={() => openStudent(s)}
              className={cn(
                "w-full text-left border-b border-border/30 p-3 hover:bg-muted/30 transition-colors flex items-center gap-3",
                activeStudent?.id === s.id && "bg-muted/50"
              )}>
              <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
                {s.full_name?.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{s.full_name}</p>
                {c?.status === "waiting" && <span className="text-[10px] gradient-secondary text-primary-foreground rounded-full px-2 py-0.5">Chờ phản hồi</span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex-1 glass-card rounded-2xl flex flex-col min-w-0">
        {activeChat && activeStudent ? (
          <>
            <div className="flex items-center justify-between border-b border-border/50 p-3">
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{activeStudent.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{activeStudent.email}</p>
              </div>
              {activeChat.status === "waiting" && activeChat.claimed_by !== profile?.id && (
                <Button size="sm" variant="accent" onClick={claim}>🟢 Nhận phiên</Button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 && <p className="text-center text-xs text-muted-foreground mt-4">Chưa có tin nhắn</p>}
              {messages.map((m) => {
                const mine = m.sender_id === profile?.id;
                return (
                  <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                      mine ? "gradient-primary text-primary-foreground" : "bg-muted text-foreground")}>
                      {m.content}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="flex items-center gap-2 border-t border-border/50 p-3">
              <Input value={text} onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Nhập tin nhắn..." className="rounded-xl" />
              <Button size="icon" variant="hero" className="rounded-xl" onClick={send}><Send size={16} /></Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageCircle size={40} className="mb-2 opacity-40" />
            <p className="text-sm">Chọn học viên để bắt đầu trò chuyện</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Client side: their own chat thread */
export function MyClientChat() {
  const { profile } = useAuth();
  const [chat, setChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase.from("client_chats").select("*").eq("client_id", profile.id).maybeSingle();
      if (data) setChat(data);
    })();
  }, [profile]);

  useEffect(() => {
    if (!chat) return;
    supabase.from("client_chat_messages").select("*").eq("chat_id", chat.id).order("created_at")
      .then(({ data }) => setMessages(data || []));
    const ch = supabase.channel(`my-ccm-${chat.id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "client_chat_messages", filter: `chat_id=eq.${chat.id}` },
        (p) => setMessages((prev) => prev.some((m) => m.id === (p.new as any).id) ? prev : [...prev, p.new]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [chat]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!text.trim() || !profile) return;
    let c = chat;
    if (!c) {
      const { data, error } = await supabase.from("client_chats")
        .insert({ client_id: profile.id, status: "waiting" }).select().single();
      if (error) { toast.error("Không tạo được phiên chat"); return; }
      c = data; setChat(c);
    }
    const content = text.trim();
    setText("");
    await supabase.from("client_chat_messages").insert({
      chat_id: c.id, sender_id: profile.id, sender_role: "client" as any, content,
    });
  };

  return (
    <div className="glass-card rounded-2xl flex flex-col h-[calc(100vh-220px)]">
      <div className="border-b border-border/50 p-3 font-semibold text-foreground flex items-center gap-2">
        <MessageCircle size={18} /> Chat với trung tâm
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && <p className="text-center text-xs text-muted-foreground mt-4">Hãy gửi tin nhắn đầu tiên 👋</p>}
        {messages.map((m) => {
          const mine = m.sender_id === profile?.id;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                mine ? "gradient-primary text-primary-foreground" : "bg-muted text-foreground")}>
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 border-t border-border/50 p-3">
        <Input value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Nhập tin nhắn..." className="rounded-xl" />
        <Button size="icon" variant="hero" className="rounded-xl" onClick={send}><Send size={16} /></Button>
      </div>
    </div>
  );
}