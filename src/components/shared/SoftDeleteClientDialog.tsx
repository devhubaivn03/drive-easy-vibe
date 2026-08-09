import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  /** Nhãn đối tượng bị xóa, vd "học viên", "nhân viên" */
  entityLabel?: string;
  /** Bắt buộc nhập YES để xác nhận */
  requireYes?: boolean;
  /** Nơi lưu trữ sau khi xóa, hiển thị trong mô tả */
  historyLabel?: string;
}

export function SoftDeleteClientDialogButton({
  clientId,
  clientName,
  onDeleted,
  entityLabel = "học viên",
  requireYes = false,
  historyLabel = "Lịch sử học viên",
}: Props) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do xóa");
      return;
    }
    if (requireYes && confirmText.trim().toUpperCase() !== "YES") {
      toast.error('Vui lòng nhập chính xác "YES" để xác nhận');
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
    toast.success(`Đã chuyển ${entityLabel} vào ${historyLabel}`);
    setOpen(false);
    setReason("");
    setConfirmText("");
    onDeleted?.();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        title={`Xóa ${entityLabel}`}
        className="text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 size={16} />
      </Button>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setReason(""); setConfirmText(""); } }}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Xóa {entityLabel}</DialogTitle>
            <DialogDescription>
              Bạn sắp chuyển {entityLabel} <b>{clientName}</b> vào phần "{historyLabel}". Vui lòng ghi rõ lý do.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Lý do xóa *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: đã tốt nghiệp, xin nghỉ, chuyển công tác..."
                className="rounded-xl min-h-24"
              />
            </div>
            {requireYes && (
              <div>
                <Label>Nhập <b>YES</b> để xác nhận *</Label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="YES"
                  className="rounded-xl"
                />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Hủy</Button>
              <Button
                variant="destructive"
                className="rounded-xl"
                onClick={submit}
                disabled={saving || (requireYes && confirmText.trim().toUpperCase() !== "YES")}
              >
                {saving ? "Đang xóa..." : "Xác nhận xóa"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}