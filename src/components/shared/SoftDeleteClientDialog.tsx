import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  clientId: string;
  clientName: string;
  onDeleted?: () => void;
}

export function SoftDeleteClientDialogButton({ clientId, clientName, onDeleted }: Props) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do xóa");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_reason: reason.trim(),
        deleted_by: profile?.id ?? null,
      } as any)
      .eq("id", clientId);
    setSaving(false);
    if (error) {
      toast.error("Xóa thất bại: " + error.message);
      return;
    }
    toast.success("Đã chuyển học viên vào lịch sử");
    setOpen(false);
    setReason("");
    onDeleted?.();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        title="Xóa học viên"
        className="text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 size={16} />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Xóa học viên</DialogTitle>
            <DialogDescription>
              Bạn sắp chuyển học viên <b>{clientName}</b> vào phần "Lịch sử học viên". Vui lòng ghi rõ lý do.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Lý do xóa *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Học viên đã tốt nghiệp, học viên xin nghỉ..."
                className="rounded-xl min-h-24"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Hủy</Button>
              <Button variant="destructive" className="rounded-xl" onClick={submit} disabled={saving}>
                {saving ? "Đang xóa..." : "Xác nhận xóa"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}