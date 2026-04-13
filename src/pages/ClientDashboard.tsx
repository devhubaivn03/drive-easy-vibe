import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TableSkeleton } from "@/components/shared/StatCard";
import { ChangeOwnPassword } from "@/components/shared/ChangeOwnPassword";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Bell, User, BookOpen, CheckCircle, Clock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", path: "/client", icon: <LayoutDashboard size={18} /> },
  { label: "Thông báo", path: "/client/notifications", icon: <Bell size={18} /> },
  { label: "Cài đặt", path: "/client/settings", icon: <Settings size={18} /> },
];

export default function ClientDashboard() {
  const { profile } = useAuth();
  const [progress, setProgress] = useState<any>(null);
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const fetch = async () => {
      const { data: prog } = await supabase
        .from("training_progress")
        .select("*")
        .eq("client_id", profile.id)
        .maybeSingle();
      setProgress(prog);

      if (profile.teacher_id) {
        const { data: t } = await supabase.from("profiles").select("full_name, phone, email").eq("id", profile.teacher_id).maybeSingle();
        setTeacher(t);
      }
      setLoading(false);
    };
    fetch();
  }, [profile]);

  const ScoreCircle = ({ label, score }: { label: string; score: number | null }) => {
    const pct = score ?? 0;
    const color = pct < 50 ? "text-destructive" : pct < 80 ? "text-yellow-500" : "text-green-500";
    const strokeColor = pct < 50 ? "#ef4444" : pct < 80 ? "#eab308" : "#22c55e";
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (pct / 100) * circumference;

    return (
      <div className="glass-card rounded-2xl p-5 flex flex-col items-center">
        <div className="relative h-24 w-24 mb-3">
          <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none" stroke={strokeColor} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000" />
          </svg>
          <div className={cn("absolute inset-0 flex items-center justify-center text-xl font-extrabold", color)}>
            {score !== null ? score : "—"}
          </div>
        </div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
    );
  };

  if (loading) return (
    <DashboardLayout navItems={navItems} roleLabel="HỌC VIÊN" roleColor="bg-blue-500 text-primary-foreground">
      <TableSkeleton rows={3} />
    </DashboardLayout>
  );

  return (
    <DashboardLayout navItems={navItems} roleLabel="HỌC VIÊN" roleColor="bg-blue-500 text-primary-foreground">
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
            {profile?.full_name?.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{profile?.full_name}</h1>
            <p className="text-sm text-muted-foreground">{profile?.email} • {profile?.phone || "—"}</p>
            <div className="flex items-center gap-2 mt-2">
              {profile?.license_type && (
                <span className="gradient-primary rounded-full px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Hạng {profile.license_type}
                </span>
              )}
              {teacher && (
                <span className="bg-muted rounded-full px-3 py-1 text-xs text-muted-foreground">
                  <User size={12} className="inline mr-1" /> GV: {teacher.full_name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-bold text-foreground flex items-center gap-2">
        <BookOpen size={20} /> Tiến trình học
      </h2>

      {progress ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
            <ScoreCircle label="Lý Thuyết" score={progress.theory_score} />
            <ScoreCircle label="Mô Phỏng" score={progress.simulation_score} />
            <ScoreCircle label="Sa Hình" score={progress.track_test_score} />
            <ScoreCircle label="Đường Trường" score={progress.road_test_score} />
          </div>

          {progress.schedule_milestones && progress.schedule_milestones.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
                <Clock size={18} /> Lịch trình học
              </h3>
              <div className="space-y-4 ml-4 border-l-2 border-border pl-6">
                {progress.schedule_milestones.map((m: any, i: number) => (
                  <div key={i} className="relative">
                    <div className={cn(
                      "absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2",
                      m.completed ? "gradient-accent border-accent" : "bg-background border-border"
                    )} />
                    <div className="flex items-center gap-2">
                      {m.completed && <CheckCircle size={16} className="text-green-500" />}
                      <span className={cn("font-medium", m.completed ? "text-foreground" : "text-muted-foreground")}>
                        {m.title}
                      </span>
                    </div>
                    {m.date && <p className="text-xs text-muted-foreground mt-1">{new Date(m.date).toLocaleDateString("vi-VN")}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {progress.notes && (
            <div className="glass-card rounded-2xl p-6 mt-4">
              <h3 className="mb-2 font-semibold text-foreground">Ghi chú từ giáo viên</h3>
              <p className="text-sm text-muted-foreground">{progress.notes}</p>
            </div>
          )}
        </>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Chưa có dữ liệu tiến trình. Giáo viên sẽ cập nhật sớm.</p>
        </div>
      )}
    </DashboardLayout>
  );
}

export function ClientNotifications() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const fetchAndMark = async () => {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", profile.id).order("created_at", { ascending: false });
      setNotifications(data || []);
      setLoading(false);

      const unread = data?.filter((n) => !n.is_read).map((n) => n.id) || [];
      if (unread.length > 0) {
        await supabase.from("notifications").update({ is_read: true }).in("id", unread);
      }
    };
    fetchAndMark();
  }, [profile]);

  return (
    <DashboardLayout navItems={navItems} roleLabel="HỌC VIÊN" roleColor="bg-blue-500 text-primary-foreground">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Thông báo</h1>
      {loading ? <TableSkeleton /> : notifications.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <Bell size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Chưa có thông báo nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className={cn("glass-card rounded-xl p-4", !n.is_read && "border-l-4 border-primary")}>
              <p className="text-sm text-foreground">{n.message}</p>
              <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("vi-VN")}</p>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export function ClientSettings() {
  return (
    <DashboardLayout navItems={navItems} roleLabel="HỌC VIÊN" roleColor="bg-blue-500 text-primary-foreground">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Cài đặt</h1>
      <ChangeOwnPassword />
    </DashboardLayout>
  );
}
