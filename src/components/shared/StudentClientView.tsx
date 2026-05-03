import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BookOpen, CheckCircle, Clock, User, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExamScoresDisplay, useExamResult } from "@/components/shared/ExamScores";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Render the same content the student sees on their dashboard, for a given client */
export function StudentClientView({ clientId }: { clientId: string }) {
  const [profile, setProfile] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { data: examData } = useExamResult(clientId);

  useEffect(() => {
    if (!clientId) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", clientId).maybeSingle();
      setProfile(p);
      const { data: prog } = await supabase
        .from("training_progress").select("*").eq("client_id", clientId).maybeSingle();
      setProgress(prog);
      if (p?.teacher_id) {
        const { data: t } = await supabase.from("profiles")
          .select("full_name, phone, email").eq("id", p.teacher_id).maybeSingle();
        setTeacher(t);
      }
      setLoading(false);
    })();
  }, [clientId]);

  const ScoreCircle = ({ label, score }: { label: string; score: number | null }) => {
    const pct = score ?? 0;
    const color = pct < 50 ? "text-destructive" : pct < 80 ? "text-yellow-500" : "text-green-500";
    const strokeColor = pct < 50 ? "#ef4444" : pct < 80 ? "#eab308" : "#22c55e";
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (pct / 100) * circumference;
    return (
      <div className="glass-card rounded-2xl p-4 flex flex-col items-center">
        <div className="relative h-20 w-20 mb-2">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none" stroke={strokeColor} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset} />
          </svg>
          <div className={cn("absolute inset-0 flex items-center justify-center text-lg font-extrabold", color)}>
            {score !== null && score !== undefined ? score : "—"}
          </div>
        </div>
        <p className="text-xs font-medium text-muted-foreground text-center">{label}</p>
      </div>
    );
  };

  if (loading) return <p className="text-sm text-muted-foreground p-4">Đang tải…</p>;
  if (!profile) return <p className="text-sm text-destructive p-4">Không tìm thấy học viên</p>;

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full gradient-primary flex items-center justify-center text-xl font-bold text-primary-foreground shrink-0">
            {profile.full_name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">{profile.full_name}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{profile.email} • {profile.phone || "—"}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {profile.license_type && (
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

      <ExamScoresDisplay data={examData} />

      <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
        <BookOpen size={18} /> Tiến trình học
      </h3>

      {progress ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <ScoreCircle label="Lý Thuyết" score={progress.theory_score} />
            <ScoreCircle label="Mô Phỏng" score={progress.simulation_score} />
            <ScoreCircle label="Sa Hình" score={progress.track_test_score} />
            <ScoreCircle label="Đường Trường" score={progress.road_test_score} />
          </div>

          {progress.schedule_milestones && progress.schedule_milestones.length > 0 && (
            <div className="glass-card rounded-2xl p-4 sm:p-6">
              <h4 className="mb-4 font-semibold text-foreground flex items-center gap-2">
                <Clock size={16} /> Lịch trình học
              </h4>
              <div className="overflow-x-auto pb-2">
                <div className="flex items-start gap-2 min-w-max">
                  {progress.schedule_milestones.map((m: any, i: number) => (
                    <div key={i} className="flex items-center">
                      <div className="flex flex-col items-center w-28">
                        <div className={cn(
                          "h-11 w-11 rounded-full border-2 flex items-center justify-center",
                          m.completed
                            ? "gradient-accent border-accent text-accent-foreground"
                            : "bg-background border-border text-muted-foreground"
                        )}>
                          {m.completed ? <CheckCircle size={20} /> : <Clock size={18} />}
                        </div>
                        <p className={cn("mt-2 text-xs font-medium text-center", m.completed ? "text-foreground" : "text-muted-foreground")}>
                          {m.title}
                        </p>
                        {m.date && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(m.date).toLocaleDateString("vi-VN")}
                          </p>
                        )}
                      </div>
                      {i < progress.schedule_milestones.length - 1 && (
                        <div className={cn("h-0.5 w-8 mt-5", m.completed ? "bg-accent" : "bg-border")} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {progress.notes && (
            <div className="glass-card rounded-2xl p-4 sm:p-6">
              <h4 className="mb-2 font-semibold text-foreground">Ghi chú từ giáo viên</h4>
              <p className="text-sm text-muted-foreground">{progress.notes}</p>
            </div>
          )}
        </>
      ) : (
        <div className="glass-card rounded-2xl p-6 text-center">
          <BookOpen size={40} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Chưa có dữ liệu tiến trình.</p>
        </div>
      )}
    </div>
  );
}

/** Eye icon button that opens a dialog showing the student's view */
export function ViewAsStudentDialogButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="icon" title="Xem với tư cách học viên" onClick={() => setOpen(true)}>
        <Eye size={16} />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-card w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Eye size={18} /> Xem trang học viên — {clientName}
            </DialogTitle>
          </DialogHeader>
          {open && <StudentClientView clientId={clientId} />}
        </DialogContent>
      </Dialog>
    </>
  );
}