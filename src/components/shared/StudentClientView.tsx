import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BookOpen, CheckCircle, Clock, User, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExamScoresDisplay, useExamResult } from "@/components/shared/ExamScores";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
          {open && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                <TabsTrigger value="practice">Ôn tập</TabsTrigger>
                <TabsTrigger value="exam">Thi thử</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-4"><StudentClientView clientId={clientId} /></TabsContent>
              <TabsContent value="practice" className="mt-4"><StudentPracticeView /></TabsContent>
              <TabsContent value="exam" className="mt-4"><StudentExamView clientId={clientId} /></TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function StudentPracticeView() {
  const [questions, setQuestions] = useState<any[]>([]);
  useEffect(() => { supabase.from("questions").select("*").order("created_at").then(({ data }) => setQuestions(data || [])); }, []);
  if (questions.length === 0) return <p className="text-sm text-muted-foreground">Chưa có câu hỏi.</p>;
  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
      <p className="text-xs text-muted-foreground">Tổng {questions.length} câu hỏi (đáp án hiển thị)</p>
      {questions.map((q, i) => (
        <div key={q.id} className="glass-card rounded-xl p-3">
          <p className="text-sm font-medium text-foreground mb-2">{i + 1}. {q.question_text}</p>
          {q.image_url && <img src={q.image_url} alt="" className="rounded mb-2 max-h-40" />}
          <div className="space-y-1">
            {[q.answer_1, q.answer_2, q.answer_3, q.answer_4].map((a, j) => a && (
              <div key={j} className={cn("text-xs p-2 rounded",
                q.correct_answer === j + 1 ? "bg-green-500/15 text-green-700 dark:text-green-300 font-medium" : "text-muted-foreground")}>
                <b className="mr-1">{String.fromCharCode(65 + j)}.</b>{a}{q.correct_answer === j + 1 && " ✓"}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StudentExamView({ clientId }: { clientId: string }) {
  const [sets, setSets] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("exam_sets").select("*, exam_set_questions(count)").order("created_at").then(({ data }) => setSets(data || []));
    supabase.from("exam_attempts").select("*").eq("client_id", clientId).order("submitted_at", { ascending: false })
      .then(({ data }) => setAttempts(data || []));
  }, [clientId]);

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div>
        <h4 className="font-semibold text-foreground mb-2">Mã đề có sẵn</h4>
        {sets.length === 0 ? <p className="text-xs text-muted-foreground">Chưa có mã đề.</p> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sets.map((s) => (
              <div key={s.id} className="glass-card rounded-xl p-3">
                <p className="font-semibold text-sm text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.exam_set_questions?.[0]?.count || 0} câu</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h4 className="font-semibold text-foreground mb-2">Lịch sử thi thử</h4>
        {attempts.length === 0 ? <p className="text-xs text-muted-foreground">Học viên chưa thi thử lần nào.</p> : (
          <div className="space-y-2">
            {attempts.map((a) => {
              const setName = sets.find((s) => s.id === a.exam_set_id)?.name || "—";
              const pct = a.total_questions ? Math.round((a.score / a.total_questions) * 100) : 0;
              return (
                <div key={a.id} className="glass-card rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{setName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(a.submitted_at).toLocaleString("vi-VN")} · {Math.floor(a.time_spent_seconds / 60)}p</p>
                  </div>
                  <span className={cn("text-sm font-bold", pct >= 70 ? "text-green-500" : "text-destructive")}>
                    {a.score}/{a.total_questions}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}