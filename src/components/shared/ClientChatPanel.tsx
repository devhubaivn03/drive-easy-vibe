import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle, Paperclip, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MAX_SIZE = 25 * 1024 * 1024;

function AttachmentView({ m }: { m: any }) {
  if (!m.attachment_url) return null;
  const t = m.attachment_type || "";
  if (t.startsWith("image/")) {
    return (
      <a href={m.attachment_url} target="_blank" rel="noreferrer" className="block mt-1">
        <img src={m.attachment_url} alt={m.attachment_name || "image"} className="max-h-48 rounded-lg object-cover" />
      </a>
    );
  }
  if (t.startsWith("video/")) {
    return <video src={m.attachment_url} controls className="max-h-56 rounded-lg mt-1" />;
  }
  return (
    <a href={m.attachment_url} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-2 underline text-xs">
      <FileText size={14} /> {m.attachment_name || "Tệp đính kèm"}
    </a>
  );
}

async function uploadAttachment(file: File, chatId: string, userId: string) {
  if (file.size > MAX_SIZE) { toast.error("Tệp tối đa 25MB"); return null; }
  const ext = file.name.split(".").pop() || "bin";
  const path = `${chatId}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
  const { error } = await supabase.storage.from("chat-attachments").upload(path, file, { contentType: file.type, upsert: false });
  if (error) { toast.error("Tải tệp lên thất bại"); return null; }
  const { data } = supabase.storage.from("chat-attachments").getPublicUrl(path);
  return { url: data.publicUrl, type: file.type, name: file.name };
}

interface Props {
  scope: "teacher" | "staff" | "admin" | "superadmin";
}

export function ClientChatPanel({ scope }: Props) {
  const { profile } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [chats, setChats] = useState<Record<string, any>>({});
  const [activeStudent, setActiveStudent] = useState<any | null>(null);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [senders, setSenders] = useState<Record<string, { full_name: string; role: string }>>({});
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const threadType: "teacher" | "staff" = scope === "teacher" ? "teacher" : "staff";

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
        const { data: cc } = await supabase
          .from("client_chats")
          .select("*")
          .in("client_id", ids)
          .eq("thread_type", threadType);
        const map: Record<string, any> = {};
        (cc || []).forEach((c) => { map[c.client_id] = c; });
        setChats(map);
      }
    };
    load();
  }, [profile, scope, threadType]);

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
      .then(async ({ data }) => {
        setMessages(data || []);
        await hydrateSenders(data || []);
      });

    const ch = supabase.channel(`ccm-${activeChat.id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "client_chat_messages", filter: `chat_id=eq.${activeChat.id}` },
        async (payload) => {
          const m: any = payload.new;
          setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
          await hydrateSenders([m]);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeChat]);

  const hydrateSenders = async (msgs: any[]) => {
    const ids = Array.from(new Set(msgs.map((m) => m.sender_id))).filter((id) => id && !senders[id]);
    if (ids.length === 0) return;
    const { data } = await supabase.from("profiles").select("id, full_name, role").in("id", ids);
    if (data) {
      setSenders((prev) => {
        const next = { ...prev };
        data.forEach((p: any) => { next[p.id] = { full_name: p.full_name, role: p.role }; });
        return next;
      });
    }
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const openStudent = async (s: any) => {
    setActiveStudent(s);
    let chat = chats[s.id];
    if (!chat) {
      const peerId = scope === "teacher" ? profile?.id
        : scope === "admin" ? profile?.id
        : scope === "staff" ? (profile as any)?.admin_id
        : null;
      const { data, error } = await supabase
        .from("client_chats")
        .insert({ client_id: s.id, claimed_by: profile?.id, status: "active",
          thread_type: threadType, peer_id: peerId })
        .select().single();
      if (error) { toast.error("Không tạo được phiên chat"); return; }
      chat = data;
      setChats((p) => ({ ...p, [s.id]: chat }));
    }
    setActiveChat(chat);
    // mark as read by peer
    const { data: upd } = await supabase.from("client_chats")
      .update({ last_peer_read_at: new Date().toISOString() })
      .eq("id", chat.id).select().single();
    if (upd) setChats((p) => ({ ...p, [s.id]: upd }));
  };

  const claim = async () => {
    if (!activeChat || !profile) return;
    const { data } = await supabase.from("client_chats").update({ claimed_by: profile.id, status: "active" })
      .eq("id", activeChat.id).select().single();
    if (data) { setActiveChat(data); setChats((p) => ({ ...p, [data.client_id]: data })); }
  };

  const send = async (file?: File | null) => {
    if (!activeChat || !profile) return;
    if (!text.trim() && !file) return;
    const content = text.trim();
    setText("");
    let att: any = null;
    if (file) {
      setUploading(true);
      att = await uploadAttachment(file, activeChat.id, profile.id);
      setUploading(false);
      if (!att) return;
    }
    await supabase.from("client_chat_messages").insert({
      chat_id: activeChat.id, sender_id: profile.id, sender_role: profile.role as any,
      content: content || (att ? `[${att.name}]` : ""),
      attachment_url: att?.url, attachment_type: att?.type, attachment_name: att?.name,
    });
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) send(f);
    e.target.value = "";
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
          const unread = !!(c?.last_client_message_at && (!c?.last_peer_read_at || new Date(c.last_client_message_at) > new Date(c.last_peer_read_at)));
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
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate flex-1">{s.full_name}</p>
                  {unread && activeStudent?.id !== s.id && (
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" title="Tin nhắn mới" />
                  )}
                </div>
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
                const sender = senders[m.sender_id];
                return (
                  <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                      mine ? "gradient-primary text-primary-foreground" : "bg-muted text-foreground")}>
                      {!mine && sender && (
                        <p className="text-[10px] font-semibold opacity-70 mb-0.5">{sender.full_name}</p>
                      )}
                      {m.content && !m.attachment_url && <span>{m.content}</span>}
                      {m.content && m.attachment_url && !m.content.startsWith("[") && <span>{m.content}</span>}
                      <AttachmentView m={m} />
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="flex items-center gap-2 border-t border-border/50 p-3">
              <input ref={fileRef} type="file" hidden onChange={onPickFile}
                accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.zip" />
              <Button size="icon" variant="ghost" className="rounded-xl" disabled={uploading}
                onClick={() => fileRef.current?.click()} title="Đính kèm">
                <Paperclip size={16} />
              </Button>
              <Input value={text} onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(null)}
                placeholder="Nhập tin nhắn..." className="rounded-xl" />
              <Button size="icon" variant="hero" className="rounded-xl" onClick={() => send(null)}><Send size={16} /></Button>
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

/** Client side: their own chat thread (with teacher OR with staff team) */
export function MyClientChat({ threadType }: { threadType: "teacher" | "staff" }) {
  const { profile } = useAuth();
  const [chat, setChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [senders, setSenders] = useState<Record<string, { full_name: string; role: string }>>({});
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const peerId = threadType === "teacher" ? (profile as any)?.teacher_id : (profile as any)?.admin_id;

  useEffect(() => {
    if (!profile || !peerId) return;
    (async () => {
      const { data } = await supabase.from("client_chats").select("*")
        .eq("client_id", profile.id).eq("thread_type", threadType).eq("peer_id", peerId).maybeSingle();
      if (data) setChat(data);
      else setChat(null);
    })();
  }, [profile, threadType, peerId]);

  const hydrateSenders = async (msgs: any[]) => {
    const ids = Array.from(new Set(msgs.map((m) => m.sender_id))).filter((id) => id && !senders[id]);
    if (ids.length === 0) return;
    const { data } = await supabase.from("profiles").select("id, full_name, role").in("id", ids);
    if (data) {
      setSenders((prev) => {
        const next = { ...prev };
        data.forEach((p: any) => { next[p.id] = { full_name: p.full_name, role: p.role }; });
        return next;
      });
    }
  };

  useEffect(() => {
    if (!chat) return;
    supabase.from("client_chat_messages").select("*").eq("chat_id", chat.id).order("created_at")
      .then(async ({ data }) => { setMessages(data || []); await hydrateSenders(data || []); });
    const ch = supabase.channel(`my-ccm-${chat.id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "client_chat_messages", filter: `chat_id=eq.${chat.id}` },
        async (p) => {
          const m: any = p.new;
          setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
          await hydrateSenders([m]);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [chat]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!text.trim() || !profile || !peerId) return;
    let c = chat;
    if (!c) {
      const { data, error } = await supabase.from("client_chats")
        .insert({ client_id: profile.id, status: "waiting", thread_type: threadType, peer_id: peerId })
        .select().single();
      if (error) { toast.error("Không tạo được phiên chat"); return; }
      c = data; setChat(c);
    }
    const content = text.trim();
    setText("");
    await supabase.from("client_chat_messages").insert({
      chat_id: c.id, sender_id: profile.id, sender_role: "client" as any, content,
    });
  };

  if (!peerId) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <MessageCircle size={40} className="mx-auto mb-2 opacity-40" />
        <p className="text-sm text-muted-foreground">
          {threadType === "teacher" ? "Bạn chưa được phân giáo viên." : "Chưa có nhân viên phụ trách."}
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl flex flex-col h-[calc(100vh-220px)]">
      <div className="border-b border-border/50 p-3 font-semibold text-foreground flex items-center gap-2">
        <MessageCircle size={18} /> {threadType === "teacher" ? "Chat với giáo viên" : "Chat với nhân viên trung tâm"}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && <p className="text-center text-xs text-muted-foreground mt-4">Hãy gửi tin nhắn đầu tiên 👋</p>}
        {messages.map((m) => {
          const mine = m.sender_id === profile?.id;
          const sender = senders[m.sender_id];
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                mine ? "gradient-primary text-primary-foreground" : "bg-muted text-foreground")}>
                {!mine && sender && (
                  <p className="text-[10px] font-semibold opacity-70 mb-0.5">
                    {sender.full_name}{sender.role && sender.role !== "client" ? ` · ${sender.role}` : ""}
                  </p>
                )}
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