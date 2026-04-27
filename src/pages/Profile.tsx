import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, Shield, Calendar, User as UserIcon, GraduationCap, Award, BookOpen, IdCard, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const roleLabels: Record<string, { label: string; color: string }> = {
  superadmin: { label: "Super Admin", color: "bg-red-500 text-white" },
  admin: { label: "Quản trị viên", color: "bg-purple-500 text-white" },
  teacher: { label: "Giáo viên", color: "bg-amber-500 text-white" },
  staff: { label: "Nhân viên", color: "bg-emerald-500 text-white" },
  client: { label: "Học viên", color: "bg-blue-500 text-white" },
};

export default function Profile() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<any>(null);
  const [teacher, setTeacher] = useState<any>(null);

  useEffect(() => {
    if (!profile) return;
    const fetchRefs = async () => {
      if (profile.admin_id) {
        const { data } = await supabase.from("profiles").select("full_name, email").eq("id", profile.admin_id).maybeSingle();
        setAdmin(data);
      }
      if (profile.teacher_id) {
        const { data } = await supabase.from("profiles").select("full_name, email, phone").eq("id", profile.teacher_id).maybeSingle();
        setTeacher(data);
      }
    };
    fetchRefs();
  }, [profile]);

  if (!profile) return null;

  const role = roleLabels[profile.role] || { label: profile.role, color: "bg-muted" };

  const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-3 py-3 border-b border-border/40 last:border-0">
      <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground break-words">{value || "—"}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full gradient-primary opacity-20 blur-3xl" />
        <div className="absolute top-1/2 -left-40 h-96 w-96 rounded-full gradient-secondary opacity-20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 glass-card border-b border-border/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft size={18} /> Quay lại
          </Button>
          <span className="font-bold gradient-text">Hồ sơ cá nhân</span>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8 relative z-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-8 mb-6 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 gradient-primary opacity-10" />
          <div className="relative">
            <div className="mx-auto h-28 w-28 rounded-full gradient-primary flex items-center justify-center text-4xl font-extrabold text-primary-foreground shadow-2xl mb-4">
              {profile.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <h1 className="text-2xl font-extrabold text-foreground mb-1">{profile.full_name}</h1>
            <p className="text-sm text-muted-foreground mb-3">{profile.email}</p>
            <span className={cn("inline-block rounded-full px-4 py-1.5 text-xs font-bold", role.color)}>
              {role.label}
            </span>
          </div>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6"
          >
            <h2 className="font-bold text-foreground mb-2 flex items-center gap-2">
              <UserIcon size={18} className="text-primary" /> Thông tin cá nhân
            </h2>
            <InfoRow icon={<UserIcon size={16} />} label="Họ và tên" value={profile.full_name} />
            <InfoRow icon={<Mail size={16} />} label="Email" value={profile.email} />
            <InfoRow icon={<Phone size={16} />} label="Số điện thoại" value={profile.phone} />
            <InfoRow icon={<IdCard size={16} />} label="ID người dùng" value={<span className="font-mono text-xs">{profile.id}</span>} />
          </motion.div>

          {/* Account */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card rounded-2xl p-6"
          >
            <h2 className="font-bold text-foreground mb-2 flex items-center gap-2">
              <Shield size={18} className="text-primary" /> Tài khoản
            </h2>
            <InfoRow icon={<Shield size={16} />} label="Vai trò" value={role.label} />
            {profile.license_type && (
              <InfoRow icon={<Award size={16} />} label="Hạng bằng lái" value={`Hạng ${profile.license_type}`} />
            )}
            {admin && (
              <InfoRow icon={<UserCog size={16} />} label="Trung tâm quản lý" value={`${admin.full_name} (${admin.email})`} />
            )}
            {teacher && (
              <InfoRow icon={<GraduationCap size={16} />} label="Giáo viên phụ trách" value={`${teacher.full_name}${teacher.phone ? ` • ${teacher.phone}` : ""}`} />
            )}
            <InfoRow icon={<Calendar size={16} />} label="Trạng thái" value={<span className="text-green-500 font-semibold">● Đang hoạt động</span>} />
          </motion.div>
        </div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6 mt-6"
        >
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-primary" /> Truy cập nhanh
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="hero" onClick={() => navigate(getDashboardPath(profile.role))} className="rounded-xl">
              Về Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate(getSettingsPath(profile.role))} className="rounded-xl">
              Cài đặt & Đổi mật khẩu
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function getDashboardPath(role: string) {
  return `/${role}`;
}
function getSettingsPath(role: string) {
  return `/${role}/settings`;
}
