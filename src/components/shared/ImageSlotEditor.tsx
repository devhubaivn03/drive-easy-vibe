import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Trash2, Plus, ArrowLeft, ArrowRight, Images } from "lucide-react";
import { toast } from "sonner";

const MAX_SIZE = 10 * 1024 * 1024;

interface ImageSlotEditorProps {
  label: string;
  hint?: string;
  value: string[];
  onChange: (urls: string[]) => void;
}

/**
 * Trình quản lý 1 "ô hình": có thể tải lên nhiều ảnh hoặc dán link ảnh.
 * Nếu ô có từ 2 ảnh trở lên, trang chủ sẽ tự đổi ảnh mỗi 2 giây.
 */
export function ImageSlotEditor({ label, hint, value, onChange }: ImageSlotEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const upload = async (files: FileList) => {
    setUploading(true);
    const added: string[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_SIZE) { toast.error(`${file.name}: ảnh tối đa 10MB`); continue; }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `site/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("chat-attachments")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) { toast.error(`Tải ${file.name} thất bại`); continue; }
      const { data } = supabase.storage.from("chat-attachments").getPublicUrl(path);
      added.push(data.publicUrl);
    }
    if (added.length) {
      onChange([...value, ...added]);
      toast.success(`Đã thêm ${added.length} ảnh`);
    }
    setUploading(false);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const n = [...value];
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };

  return (
    <div className="rounded-xl border border-border/50 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Images size={15} /> {label}
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {value.length} ảnh
            </span>
          </p>
          {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
        </div>
        <Button size="sm" variant="outline" className="rounded-xl shrink-0" disabled={uploading}
          onClick={() => fileRef.current?.click()}>
          <Upload size={14} /> {uploading ? "Đang tải..." : "Tải ảnh lên"}
        </Button>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden
          onChange={(e) => { if (e.target.files?.length) upload(e.target.files); e.target.value = ""; }} />
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {value.map((url, i) => (
            <div key={url + i} className="relative overflow-hidden rounded-xl border border-border/50">
              <img src={url} alt="" className="h-24 w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-foreground/60 px-1 py-0.5">
                <button type="button" onClick={() => move(i, -1)} className="text-background disabled:opacity-30" disabled={i === 0}>
                  <ArrowLeft size={14} />
                </button>
                <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-destructive-foreground">
                  <Trash2 size={14} />
                </button>
                <button type="button" onClick={() => move(i, 1)} className="text-background disabled:opacity-30" disabled={i === value.length - 1}>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Hoặc dán link ảnh (https://...)"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          className="rounded-xl"
        />
        <Button size="sm" variant="outline" className="rounded-xl shrink-0"
          onClick={() => { if (urlInput.trim()) { onChange([...value, urlInput.trim()]); setUrlInput(""); } }}>
          <Plus size={14} /> Thêm link
        </Button>
      </div>
    </div>
  );
}
