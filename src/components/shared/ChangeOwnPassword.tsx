import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";

export function ChangeOwnPassword() {
  const { profile } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = async () => {
    if (!profile) return;
    if (!currentPassword || !newPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Xác nhận mật khẩu không khớp");
      return;
    }

    setSaving(true);

    // Verify current password by attempting sign-in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });

    if (signInError) {
      toast.error("Mật khẩu hiện tại không đúng");
      setSaving(false);
      return;
    }

    // Update password
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error("Đổi mật khẩu thất bại: " + error.message);
    } else {
      toast.success("Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSaving(false);
  };

  return (
    <div className="glass-card rounded-2xl p-6 max-w-md">
      <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-foreground">
        <KeyRound size={20} />
        Đổi mật khẩu
      </h3>
      <div className="space-y-4">
        <div>
          <Label>Mật khẩu hiện tại</Label>
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Nhập mật khẩu hiện tại"
            className="rounded-xl"
          />
        </div>
        <div>
          <Label>Mật khẩu mới</Label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Tối thiểu 6 ký tự"
            className="rounded-xl"
          />
        </div>
        <div>
          <Label>Xác nhận mật khẩu mới</Label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu mới"
            className="rounded-xl"
          />
        </div>
        <Button variant="hero" className="w-full rounded-xl" onClick={handleChange} disabled={saving}>
          {saving ? "Đang đổi..." : "Đổi mật khẩu"}
        </Button>
      </div>
    </div>
  );
}
