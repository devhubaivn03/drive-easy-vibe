import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function ContactWidget() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setLoading(true);

    const { error } = await supabase.from("contact_leads").insert({
      name: name.trim(),
      phone: phone.trim(),
      content: content.trim() || null,
    });

    if (error) {
      toast.error("Gửi thất bại, vui lòng thử lại");
    } else {
      toast.success("Đã gửi thông tin thành công! Chúng tôi sẽ liên hệ bạn sớm.");
      setName("");
      setPhone("");
      setContent("");
      setOpen(false);
    }
    setLoading(false);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full gradient-primary shadow-lg animate-pulse-glow"
      >
        <ClipboardList className="h-6 w-6 text-primary-foreground" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-40 right-6 z-50 w-80 glass-card rounded-2xl p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-foreground">📋 Để lại thông tin</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <Input placeholder="Họ và tên *" value={name} onChange={(e) => setName(e.target.value)} required className="rounded-xl" />
              <Input placeholder="Số điện thoại *" value={phone} onChange={(e) => setPhone(e.target.value)} required className="rounded-xl" />
              <Textarea placeholder="Nội dung (tùy chọn)" value={content} onChange={(e) => setContent(e.target.value)} className="rounded-xl" rows={3} />
              <Button type="submit" variant="hero" className="w-full rounded-xl" disabled={loading}>
                <Send size={16} />
                {loading ? "Đang gửi..." : "Gửi thông tin"}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
