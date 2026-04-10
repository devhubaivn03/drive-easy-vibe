import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

function getVisitorToken(): string {
  let token = localStorage.getItem("visitor_token");
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("visitor_token", token);
  }
  return token;
}

interface ChatMsg {
  id: string;
  sender_type: "visitor" | "staff";
  content: string;
  created_at: string;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const visitorToken = getVisitorToken();

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase
        .from("chat_sessions")
        .select("id, visitor_name")
        .eq("visitor_token", visitorToken)
        .in("status", ["waiting", "active"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setSessionId(data.id);
        setName(data.visitor_name || "");
        setStarted(true);
      }
    };
    checkSession();
  }, []);

  const loadMessages = async (sid: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sid)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  // Subscribe to new messages & load existing ones
  useEffect(() => {
    if (!sessionId) return;
    
    // Load all existing messages first
    loadMessages(sessionId);

    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        const newMsg = payload.new as ChatMsg;
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startChat = async () => {
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ visitor_name: name.trim() || null, visitor_token: visitorToken })
      .select("id")
      .single();

    if (data && !error) {
      setSessionId(data.id);
      setStarted(true);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !sessionId) return;
    const content = message.trim();
    setMessage("");

    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      sender_type: "visitor",
      content,
    });
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full gradient-accent shadow-lg"
      >
        <MessageCircle className="h-6 w-6 text-accent-foreground" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 flex h-[420px] w-80 flex-col glass-card rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between gradient-primary px-4 py-3">
              <span className="font-semibold text-primary-foreground">💬 Chat trực tuyến</span>
              <button onClick={() => setOpen(false)} className="text-primary-foreground/70 hover:text-primary-foreground">
                <X size={18} />
              </button>
            </div>

            {!started ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-5">
                <p className="text-center text-sm text-muted-foreground">Nhập tên (tùy chọn) để bắt đầu chat</p>
                <Input placeholder="Tên của bạn" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
                <Button variant="hero" className="w-full rounded-xl" onClick={startChat}>
                  Bắt đầu chat
                </Button>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {messages.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground mt-4">
                      Chúng tôi sẽ phản hồi sớm nhất có thể 🙌
                    </p>
                  )}
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_type === "visitor" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                        msg.sender_type === "visitor"
                          ? "gradient-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="flex items-center gap-2 border-t border-border p-3">
                  <Input
                    placeholder="Nhập tin nhắn..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    className="flex-1 rounded-xl"
                  />
                  <Button size="icon" variant="hero" className="rounded-xl" onClick={sendMessage}>
                    <Send size={16} />
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
