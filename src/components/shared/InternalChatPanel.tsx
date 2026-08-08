import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare, Paperclip, FileText, Search, MoreVertical, Undo2, Trash2, Building2, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MAX_SIZE = 25 * 1024 * 1024;
const INTERNAL_ROLES = ["superadmin", "admin", "teacher", "staff"] as const;
type InternalRole = typeof INTERNAL_ROLES[number];

const ROLE_LABEL: Record<string, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  teacher: "Giáo viên",
  staff: "Nhân viên",
  client: "Học viên",
};

const ROLE_BADGE: Record<string, string> = {
  superadmin: "gradient-primary text-primary-foreground",
  admin: "bg-orange-500 text-primary-foreground",
  teacher: "gradient-accent text-accent-foreground",
  staff: "bg-yellow-500 text-foreground",
};

function pairIds(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

async function uploadAttachment(file: File, chatId: string, userId: string) {
  if (file.size > MAX_SIZE) { toast.error("Tệp tối đa 25MB"); return null; }
  const ext = file.name.split(".").pop() || "bin";
  const path = `internal/${chatId}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("chat-attachments").upload(path, file, { contentType: file.type, upsert: false });
  if (error) { toast.error("Tải tệp thất bại"); return null; }
  const { data } = supabase.storage.from("chat-attachments").getPublicUrl(path);
  return { url: data.publicUrl, type: file.type, name: file.name };
}

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

export function InternalChatPanel() {
  const { profile, branch } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [mode, setMode] = useState<"branch" | "cross">("branch");
  const [crossBranchId, setCrossBranchId] = useState<string | null>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [activePeer, setActivePeer] = useState<any | null>(null);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load all internal users (excluding self, excluding client role)
  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, avatar_url, branch_id")
        .in("role", INTERNAL_ROLES as unknown as InternalRole[])
        .neq("id", profile.id)
        .is("deleted_at", null)
        .order("full_name");
      setUsers(data || []);
    })();
  }, [profile]);

  // Danh sách chi nhánh (cho chế độ chat liên chi nhánh)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("branches").select("id, name, code").order("name");
      setBranches(data || []);
    })();
  }, []);

  // Load my chats
  const loadChats = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("internal_chats")
      .select("*")
      .or(`user_a.eq.${profile.id},user_b.eq.${profile.id}`)
      .order("last_message_at", { ascending: false });
    setChats(data || []);
  };
  useEffect(() => { loadChats(); /* eslint-disable-next-line */ }, [profile]);

  // Realtime for chat list
  useEffect(() => {
    if (!profile) return;
    const ch = supabase.channel("internal-chats-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "internal_chats" }, () => loadChats())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [profile]);

  // Load messages for active chat
  useEffect(() => {
    if (!activeChat) { setMessages([]); return; }
    (async () => {
      const { data } = await supabase
        .from("internal_chat_messages")
        .select("*")
        .eq("chat_id", activeChat.id)
        .order("created_at");
      setMessages(data || []);
    })();
    const ch = supabase.channel(`icm-${activeChat.id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "internal_chat_messages", filter: `chat_id=eq.${activeChat.id}` },
        (p) => {
          const m: any = p.new;
          setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
        })
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "internal_chat_messages", filter: `chat_id=eq.${activeChat.id}` },
        (p) => {
          const m: any = p.new;
          setMessages((prev) => prev.map((x) => x.id === m.id ? m : x));
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeChat]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const openPeer = async (peer: any) => {
    if (!profile) return;
    setActivePeer(peer);
    const [a, b] = pairIds(profile.id, peer.id);
    let { data: chat } = await supabase.from("internal_chats").select("*").eq("user_a", a).eq("user_b", b).maybeSingle();
    if (!chat) {
      const { data, error } = await supabase.from("internal_chats").insert({ user_a: a, user_b: b } as any).select().single();
      if (error) { toast.error("Không tạo được cuộc chat"); return; }
      chat = data;
      loadChats();
    }
    // mark read
    const readField = chat.user_a === profile.id ? "last_read_a" : "last_read_b";
    await supabase.from("internal_chats").update({ [readField]: new Date().toISOString() } as any).eq("id", chat.id);
    setActiveChat(chat);
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
    await supabase.from("internal_chat_messages").insert({
      chat_id: activeChat.id, sender_id: profile.id,
      content: content || (att ? `[${att.name}]` : ""),
      attachment_url: att?.url, attachment_type: att?.type, attachment_name: att?.name,
    } as any);
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) send(f);
    e.target.value = "";
  };

  const recallMessage = async (m: any) => {
    if (!confirm("Thu hồi tin nhắn này? Cả 2 phía sẽ thấy 'đã thu hồi'.")) return;
    const { error } = await supabase.from("internal_chat_messages")
      .update({ recalled_at: new Date().toISOString() } as any).eq("id", m.id);
    if (error) toast.error("Thu hồi thất bại");
  };

  const deleteMessage = async (m: any) => {
    if (!confirm("Xóa tin nhắn này? Sẽ ẩn khỏi cả 2 phía.")) return;
    const { error } = await supabase.from("internal_chat_messages")
      .update({ deleted_at: new Date().toISOString() } as any).eq("id", m.id);
    if (error) toast.error("Xóa thất bại");
  };

  // Merge users + chats to show recent contacts at top with unread indicator
  const usersById = useMemo(() => {
    const map = new Map<string, any>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const chatByPeerId = useMemo(() => {
    if (!profile) return new Map<string, any>();
    const map = new Map<string, any>();
    chats.forEach((c) => {
      const peerId = c.user_a === profile.id ? c.user_b : c.user_a;
      map.set(peerId, c);
    });
    return map;
  }, [chats, profile]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = users;
    if (mode === "branch") {
      // Chỉ người cùng chi nhánh (superadmin không có ràng buộc chi nhánh nên xem tất cả)
      if (profile?.role !== "superadmin") {
        list = list.filter((u) => u.branch_id === (profile?.branch_id ?? null));
      }
    } else {
      list = list.filter((u) => (crossBranchId ? u.branch_id === crossBranchId : false));
    }
    if (q) {
      list = list.filter((u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        ROLE_LABEL[u.role]?.toLowerCase().includes(q)
      );
    }
    // sort: has chat first (by last_message_at desc), then alpha
    return [...list].sort((a, b) => {
      const ca = chatByPeerId.get(a.id);
      const cb = chatByPeerId.get(b.id);
      if (ca && !cb) return -1;
      if (!ca && cb) return 1;
      if (ca && cb) return new Date(cb.last_message_at).getTime() - new Date(ca.last_message_at).getTime();
      return (a.full_name || "").localeCompare(b.full_name || "");
    });
  }, [users, search, chatByPeerId, mode, crossBranchId, profile]);

  const branchName = (id: string | null) => branches.find((b) => b.id === id)?.name || "Chưa gán chi nhánh";
  const showCrossTab = profile?.role === "admin" || profile?.role === "teacher" || profile?.role === "staff";
  const otherBranches = branches.filter((b) => b.id !== profile?.branch_id);

  const isUnread = (c: any) => {
    if (!c || !profile) return false;
    const myReadField = c.user_a === profile.id ? "last_read_a" : "last_read_b";
    const myRead = c[myReadField];
    return !!c.last_message_at && (!myRead || new Date(c.last_message_at) > new Date(myRead));
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-220px)]">
      <div className="md:w-80 glass-card rounded-2xl flex flex-col flex-shrink-0 min-h-0">
        <div className="p-3 border-b border-border/50">
          {showCrossTab ? (
            <div className="mb-2 grid grid-cols-2 gap-1 rounded-xl bg-muted/50 p-1">
              <button
                onClick={() => { setMode("branch"); setCrossBranchId(null); }}
                className={cn("rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1",
                  mode === "branch" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>
                <Building2 size={13} /> {branch?.name || "Chi nhánh của tôi"}
              </button>
              <button
                onClick={() => setMode("cross")}
                className={cn("rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1",
                  mode === "cross" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>
                <Network size={13} /> Chat liên chi nhánh
              </button>
            </div>
          ) : (
            <p className="font-semibold text-foreground text-sm mb-2">Người dùng nội bộ</p>
          )}
          {mode === "cross" && (
            <div className="mb-2 flex flex-wrap gap-1">
              {otherBranches.length === 0 && <p className="text-xs text-muted-foreground">Chưa có chi nhánh khác.</p>}
              {otherBranches.map((b) => (
                <button key={b.id} onClick={() => setCrossBranchId(b.id)}
                  className={cn("rounded-full border px-2 py-1 text-[11px] font-medium transition-colors",
                    crossBranchId === b.id ? "gradient-primary text-primary-foreground border-transparent" : "border-border text-muted-foreground hover:bg-muted/40")}>
                  {b.name}
                </button>
              ))}
            </div>
          )}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Tìm tên, email, vai trò..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 rounded-xl h-9 text-sm" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {mode === "cross" && !crossBranchId
            ? <p className="p-4 text-sm text-muted-foreground text-center">Chọn một chi nhánh phía trên để tìm tài khoản.</p>
            : filteredUsers.length === 0 && <p className="p-4 text-sm text-muted-foreground text-center">Không tìm thấy người dùng</p>}
          {filteredUsers.map((u) => {
            const c = chatByPeerId.get(u.id);
            const unread = c && isUnread(c) && activePeer?.id !== u.id;
            return (
              <button key={u.id} onClick={() => openPeer(u)}
                className={cn(
                  "w-full text-left border-b border-border/30 p-3 hover:bg-muted/30 transition-colors flex items-center gap-3",
                  activePeer?.id === u.id && "bg-muted/50"
                )}>
                <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
                  {u.full_name?.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate flex-1">{u.full_name}</p>
                    {unread && <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" title="Tin nhắn mới" />}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={cn("text-[10px] rounded-full px-1.5 py-0.5 font-semibold", ROLE_BADGE[u.role])}>
                      {ROLE_LABEL[u.role]}
                    </span>
                    {mode === "cross" && <span className="text-[10px] text-muted-foreground truncate">{branchName(u.branch_id)}</span>}
                    <span className="text-[10px] text-muted-foreground truncate">{u.email}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 glass-card rounded-2xl flex flex-col min-w-0">
        {activeChat && activePeer ? (
          <>
            <div className="border-b border-border/50 p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                {activePeer.full_name?.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate flex items-center gap-2">
                  {activePeer.full_name}
                  <span className={cn("text-[10px] rounded-full px-2 py-0.5 font-semibold", ROLE_BADGE[activePeer.role])}>
                    {ROLE_LABEL[activePeer.role]}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground truncate">{activePeer.email}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 && <p className="text-center text-xs text-muted-foreground mt-4">Chưa có tin nhắn. Hãy gửi lời chào 👋</p>}
              {messages.filter((m) => !m.deleted_at).map((m) => {
                const mine = m.sender_id === profile?.id;
                const recalled = !!m.recalled_at;
                return (
                  <div key={m.id} className={cn("flex group", mine ? "justify-end" : "justify-start")}>
                    {mine && !recalled && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity mr-1 self-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7">
                              <MoreVertical size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => recallMessage(m)}>
                              <Undo2 size={14} className="mr-2" /> Thu hồi
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteMessage(m)} className="text-destructive">
                              <Trash2 size={14} className="mr-2" /> Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                    <div className={cn("max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                      mine ? "gradient-primary text-primary-foreground" : "bg-muted text-foreground",
                      recalled && "italic opacity-70"
                    )}>
                      {recalled ? (
                        <span>Tin nhắn đã được thu hồi</span>
                      ) : (
                        <>
                          {m.content && !m.content.startsWith("[") && <span className="whitespace-pre-wrap break-words">{m.content}</span>}
                          <AttachmentView m={m} />
                        </>
                      )}
                      <p className={cn("text-[10px] mt-1 opacity-60", mine ? "text-right" : "")}>
                        {new Date(m.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="flex items-center gap-2 border-t border-border/50 p-3">
              <input ref={fileRef} type="file" hidden onChange={onPickFile}
                accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt" />
              <Button size="icon" variant="ghost" className="rounded-xl" disabled={uploading}
                onClick={() => fileRef.current?.click()} title="Đính kèm ảnh, video, tệp">
                <Paperclip size={16} />
              </Button>
              <Input value={text} onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send(null))}
                placeholder="Nhập tin nhắn..." className="rounded-xl" />
              <Button size="icon" variant="hero" className="rounded-xl" onClick={() => send(null)}>
                <Send size={16} />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
            <MessageSquare size={40} className="mb-2 opacity-40" />
            <p className="text-sm text-center">Chọn một người dùng để bắt đầu cuộc trò chuyện.<br />Tìm theo tên, email hoặc vai trò.</p>
          </div>
        )}
      </div>
    </div>
  );
}