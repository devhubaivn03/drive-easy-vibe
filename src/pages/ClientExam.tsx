import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Bell, Settings, BookOpen, FileText, MessagesSquare, Play, Clock, ChevronLeft, ChevronRight, RotateCcw, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", path: "/client", icon: <LayoutDashboard size={18} /> },
  { label: "Ôn tập", path: "/client/practice", icon: <BookOpen size={18} /> },
  { label: "Thi thử", path: "/client/exam", icon: <FileText size={18} /> },
  { label: "Chat với GV", path: "/client/chat", icon: <MessagesSquare size={18} /> },
  { label: "Thông báo", path: "/client/notifications", icon: <Bell size={18} /> },
  { label: "Cài đặt", path: "/client/settings", icon: <Settings size={18} /> },
];

const EXAM_DURATION = 22 * 60; // 22 phút

type Mode = "list" | "exam" | "result";

export default function ClientExam() {
  const { profile } = useAuth();
  const [mode, setMode] = useState<Mode>("list");
  const [examSets, setExamSets] = useState<any[]>([]);
  const [bestScores, setBestScores] = useState<Record<string, number>>({});
  const [activeSet, setActiveSet] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [resultData, setResultData] = useState<{ score: number; total: number; time: number } | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const loadList = async () => {
    const { data: sets } = await supabase.from("exam_sets").select("*, exam_set_questions(count)").order("created_at");
    setExamSets(sets || []);
    if (profile) {
      const { data: attempts } = await supabase.from("exam_attempts").select("exam_set_id, score").eq("client_id", profile.id);
      const best: Record<string, number> = {};
      (attempts || []).forEach((a) => {
        if (!best[a.exam_set_id] || a.score > best[a.exam_set_id]) best[a.exam_set_id] = a.score;
      });
      setBestScores(best);
    }
  };

  useEffect(() => { if (profile) loadList(); }, [profile]);

  const startExam = async (set: any) => {
    const { data } = await supabase.from("exam_set_questions").select("*").eq("exam_set_id", set.id).order("order_index");
    if (!data || data.length === 0) { toast.error("Mã đề không có câu hỏi"); return; }
    setActiveSet(set);
    setQuestions(data);
    setAnswers({});
    setCurrentIdx(0);
    setTimeLeft(EXAM_DURATION);
    startTimeRef.current = Date.now();
    setMode("exam");
  };

  const submitExam = async (auto = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    let score = 0;
    questions.forEach((q, i) => { if (answers[i] === q.correct_answer) score++; });
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const result = { score, total: questions.length, time: elapsed };
    setResultData(result);
    if (profile && activeSet) {
      await supabase.from("exam_attempts").insert({
        client_id: profile.id,
        exam_set_id: activeSet.id,
        answers: answers as any,
        score,
        total_questions: questions.length,
        time_spent_seconds: elapsed,
      });
    }
    if (auto) toast.warning("Hết giờ! Bài thi đã được nộp tự động.");
    else toast.success("Đã nộp bài");
    setMode("result");
  };

  // Timer
  useEffect(() => {
    if (mode !== "exam") return;
    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          submitExam(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleSubmitClick = () => {
    const unanswered = questions.length - Object.keys(answers).length;
    if (unanswered > 0) setConfirmSubmit(true);
    else submitExam();
  };

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const timerColor = timeLeft <= 60 ? "text-red-500 animate-pulse" : timeLeft <= 300 ? "text-yellow-500" : "text-primary";

  // ===== RENDER LIST =====
  if (mode === "list") {
    return (
      <DashboardLayout navItems={navItems} roleLabel="HỌC VIÊN" roleColor="bg-blue-500 text-primary-foreground">
        <h1 className="mb-6 text-2xl font-bold text-foreground flex items-center gap-2"><FileText size={24} /> Thi thử theo mã đề</h1>
        {examSets.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center"><p className="text-muted-foreground">Chưa có mã đề nào.</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {examSets.map((s) => {
              const count = s.exam_set_questions?.[0]?.count || 0;
              const best = bestScores[s.id];
              return (
                <div key={s.id} className="glass-card rounded-2xl p-5">
                  <h3 className="font-bold text-lg text-foreground mb-1">{s.name}</h3>
                  <p className="text-sm text-muted-foreground mb-1">{count} câu • 22 phút</p>
                  {best !== undefined && <p className="text-xs mb-3"><span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">Cao nhất: {best}/{count}</span></p>}
                  <Button variant="hero" className="w-full mt-2" onClick={() => startExam(s)} disabled={count === 0}><Play size={16} className="mr-2" /> Bắt đầu thi</Button>
                </div>
              );
            })}
          </div>
        )}
      </DashboardLayout>
    );
  }

  // ===== RENDER EXAM =====
  if (mode === "exam") {
    const q = questions[currentIdx];
    const answers_arr = [q.answer_1, q.answer_2, q.answer_3, q.answer_4];
    return (
      <DashboardLayout navItems={navItems} roleLabel="HỌC VIÊN" roleColor="bg-blue-500 text-primary-foreground">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
          <div className="glass-card rounded-2xl p-3 lg:sticky lg:top-4 lg:self-start max-h-[80vh] overflow-y-auto">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Câu hỏi</p>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((_, i) => (
                <button key={i} onClick={() => setCurrentIdx(i)}
                  className={cn("aspect-square rounded text-xs font-semibold transition-all",
                    i === currentIdx && "ring-2 ring-primary ring-offset-1",
                    answers[i] !== undefined ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"
                  )}
                >{i + 1}</button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-4 flex items-center justify-between sticky top-0 z-10">
              <div>
                <p className="text-xs text-muted-foreground">{activeSet?.name}</p>
                <p className="text-sm font-semibold">Câu {currentIdx + 1} / {questions.length}</p>
              </div>
              <div className={cn("flex items-center gap-2 text-2xl font-bold tabular-nums", timerColor)}>
                <Clock size={22} /> {fmtTime(timeLeft)}
              </div>
              <Button onClick={handleSubmitClick} variant="hero">📤 Nộp bài</Button>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">{q.question_text}</h3>
              {q.image_url && <img src={q.image_url} alt="" className="rounded-lg mb-4 max-h-64 mx-auto" />}
              <div className="space-y-2">
                {answers_arr.map((a, i) => {
                  if (!a) return null;
                  const num = i + 1;
                  const picked = answers[currentIdx] === num;
                  return (
                    <button key={i} onClick={() => setAnswers({ ...answers, [currentIdx]: num })}
                      className={cn("w-full text-left p-3 rounded-lg border-2 transition-all flex items-center gap-3",
                        picked ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                      )}
                    >
                      <span className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center", picked ? "border-primary" : "border-muted-foreground")}>
                        {picked && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                      </span>
                      <span><b className="mr-2">{String.fromCharCode(65 + i)}.</b>{a}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}><ChevronLeft size={16} /> Câu trước</Button>
                <Button variant="outline" onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))} disabled={currentIdx === questions.length - 1}>Câu tiếp <ChevronRight size={16} /></Button>
              </div>
            </div>
          </div>
        </div>

        <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Nộp bài?</AlertDialogTitle>
              <AlertDialogDescription>Bạn còn {questions.length - Object.keys(answers).length} câu chưa trả lời. Bạn có chắc muốn nộp bài?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Tiếp tục làm</AlertDialogCancel>
              <AlertDialogAction onClick={() => { setConfirmSubmit(false); submitExam(); }}>Nộp bài</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout>
    );
  }

  // ===== RENDER RESULT =====
  if (mode === "result" && resultData) {
    const pct = Math.round((resultData.score / resultData.total) * 100);
    const passed = pct >= 70;
    return (
      <DashboardLayout navItems={navItems} roleLabel="HỌC VIÊN" roleColor="bg-blue-500 text-primary-foreground">
        <div className="glass-card rounded-2xl p-6 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-center">
            <div className="w-40 h-40 mx-auto">
              <CircularProgressbar value={pct} text={`${pct}%`}
                styles={buildStyles({ pathColor: passed ? "#22c55e" : "#ef4444", textColor: passed ? "#22c55e" : "#ef4444", trailColor: "hsl(var(--muted))" })}
              />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-foreground">{resultData.score} / {resultData.total} điểm</h2>
              <p className="text-sm text-muted-foreground mt-1">Thời gian: {Math.floor(resultData.time / 60)}p {resultData.time % 60}s</p>
              <div className="mt-3">
                {passed
                  ? <span className="inline-block bg-green-500 text-white rounded-full px-4 py-1.5 font-semibold">🎉 Đạt</span>
                  : <span className="inline-block bg-red-500 text-white rounded-full px-4 py-1.5 font-semibold">❌ Chưa đạt</span>}
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="hero" onClick={() => startExam(activeSet)}><RotateCcw size={16} className="mr-2" /> Thi lại</Button>
                <Button variant="outline" onClick={() => setShowReview(!showReview)}><ListChecks size={16} className="mr-2" /> Xem đáp án</Button>
                <Button variant="ghost" onClick={() => { setMode("list"); loadList(); }}>Về danh sách</Button>
              </div>
            </div>
          </div>
        </div>

        {showReview && (
          <div className="space-y-3">
            {questions.map((q, i) => {
              const userAns = answers[i];
              const correct = q.correct_answer;
              const isCorrect = userAns === correct;
              const skipped = userAns === undefined;
              return (
                <div key={q.id} className="glass-card rounded-xl p-4">
                  <p className="font-semibold mb-2">{i + 1}. {q.question_text}
                    {isCorrect && <span className="ml-2 text-xs bg-green-500/20 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">Đúng</span>}
                    {!isCorrect && !skipped && <span className="ml-2 text-xs bg-red-500/20 text-red-700 dark:text-red-300 px-2 py-0.5 rounded">Sai</span>}
                    {skipped && <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded">Bỏ qua</span>}
                  </p>
                  {q.image_url && <img src={q.image_url} alt="" className="rounded mb-2 max-h-40" />}
                  <div className="space-y-1">
                    {[q.answer_1, q.answer_2, q.answer_3, q.answer_4].map((a, j) => {
                      if (!a) return null;
                      const num = j + 1;
                      const isUserPick = userAns === num;
                      const isRight = correct === num;
                      return (
                        <div key={j} className={cn("p-2 rounded text-sm",
                          skipped && isRight && "bg-yellow-500/20 text-yellow-800 dark:text-yellow-200 font-medium",
                          !skipped && isRight && "bg-green-500/20 text-green-800 dark:text-green-200 font-medium",
                          !skipped && isUserPick && !isRight && "bg-red-500/20 text-red-800 dark:text-red-200",
                          !isUserPick && !isRight && "text-muted-foreground"
                        )}>
                          <b className="mr-1">{String.fromCharCode(65 + j)}.</b>{a}
                          {isRight && " ✓"}
                          {isUserPick && !isRight && " ✗"}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div className="glass-card rounded-xl p-4 text-sm">
              Tổng kết: <b className="text-green-600">{questions.filter((_, i) => answers[i] === questions[i].correct_answer).length} đúng</b> • <b className="text-red-600">{questions.filter((_, i) => answers[i] !== undefined && answers[i] !== questions[i].correct_answer).length} sai</b> • <b className="text-yellow-600">{questions.filter((_, i) => answers[i] === undefined).length} bỏ qua</b>
            </div>
          </div>
        )}
      </DashboardLayout>
    );
  }

  return null;
}
