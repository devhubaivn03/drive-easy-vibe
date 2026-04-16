import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Bell, Settings, BookOpen, FileText, ChevronLeft, ChevronRight, X, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", path: "/client", icon: <LayoutDashboard size={18} /> },
  { label: "Ôn tập", path: "/client/practice", icon: <BookOpen size={18} /> },
  { label: "Thi thử", path: "/client/exam", icon: <FileText size={18} /> },
  { label: "Thông báo", path: "/client/notifications", icon: <Bell size={18} /> },
  { label: "Cài đặt", path: "/client/settings", icon: <Settings size={18} /> },
];

type QStatus = "unseen" | "correct" | "wrong";

export default function ClientPractice() {
  const { profile } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const storageKey = `practice_status_${profile?.id || "anon"}`;
  const [statuses, setStatuses] = useState<Record<string, QStatus>>({});

  useEffect(() => {
    supabase.from("questions").select("*").order("created_at").then(({ data }) => {
      setQuestions(data || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setStatuses(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  const updateStatus = (qid: string, st: QStatus) => {
    const next = { ...statuses, [qid]: st };
    setStatuses(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const reviewedCount = useMemo(() => questions.filter((q) => statuses[q.id]).length, [questions, statuses]);

  const currentQ = openIdx !== null ? questions[openIdx] : null;

  return (
    <DashboardLayout navItems={navItems} roleLabel="HỌC VIÊN" roleColor="bg-blue-500 text-primary-foreground">
      <h1 className="mb-2 text-2xl font-bold text-foreground flex items-center gap-2"><BookOpen size={24} /> Ôn tập lý thuyết</h1>
      <p className="text-sm text-muted-foreground mb-6">Đã ôn {reviewedCount} / {questions.length} câu</p>

      {loading ? <p>Đang tải...</p> : questions.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center"><p className="text-muted-foreground">Chưa có câu hỏi nào trong ngân hàng.</p></div>
      ) : (
        <div className="glass-card rounded-2xl p-4">
          <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 gap-2">
            {questions.map((q, i) => {
              const st = statuses[q.id];
              return (
                <button
                  key={q.id}
                  onClick={() => setOpenIdx(i)}
                  className={cn(
                    "aspect-square rounded-md text-sm font-semibold transition-all hover:scale-105",
                    !st && "bg-muted text-muted-foreground hover:bg-muted/80",
                    st === "correct" && "bg-green-500 text-white",
                    st === "wrong" && "bg-red-500 text-white",
                  )}
                >{i + 1}</button>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={openIdx !== null} onOpenChange={(o) => !o && setOpenIdx(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {currentQ && (
            <QuestionView
              q={currentQ}
              index={openIdx!}
              total={questions.length}
              status={statuses[currentQ.id]}
              onAnswer={(correct) => updateStatus(currentQ.id, correct ? "correct" : "wrong")}
              onPrev={() => setOpenIdx((openIdx! - 1 + questions.length) % questions.length)}
              onNext={() => setOpenIdx((openIdx! + 1) % questions.length)}
              onClose={() => setOpenIdx(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function QuestionView({ q, index, total, status, onAnswer, onPrev, onNext, onClose }: any) {
  const [picked, setPicked] = useState<number | null>(null);
  useEffect(() => { setPicked(null); }, [q.id]);

  const answers = [q.answer_1, q.answer_2, q.answer_3, q.answer_4];
  const locked = picked !== null || !!status;

  const handlePick = (i: number) => {
    if (locked) return;
    const num = i + 1;
    setPicked(num);
    onAnswer(num === q.correct_answer);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">Câu {index + 1} / {total}</p>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-3">{q.question_text}</h3>
      {q.image_url && <img src={q.image_url} alt="" className="rounded-lg mb-4 max-h-64 mx-auto" />}
      <div className="space-y-2">
        {answers.map((a, i) => {
          if (!a) return null;
          const num = i + 1;
          const isCorrect = num === q.correct_answer;
          const isPicked = picked === num;
          const showResult = locked;
          return (
            <button
              key={i}
              onClick={() => handlePick(i)}
              disabled={locked}
              className={cn(
                "w-full text-left p-3 rounded-lg border-2 transition-all",
                !showResult && "border-border hover:border-primary hover:bg-muted",
                showResult && isCorrect && "border-green-500 bg-green-500/10 text-foreground",
                showResult && !isCorrect && isPicked && "border-red-500 bg-red-500/10 text-foreground",
                showResult && !isCorrect && !isPicked && "border-border opacity-60",
              )}
            >
              <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>{a}
              {showResult && isCorrect && <CheckCircle2 size={18} className="inline ml-2 text-green-500" />}
              {showResult && !isCorrect && isPicked && <XCircle size={18} className="inline ml-2 text-red-500" />}
            </button>
          );
        })}
      </div>
      {locked && (
        <p className={cn("mt-3 text-sm font-medium", (picked === q.correct_answer || status === "correct") ? "text-green-600" : "text-red-600")}>
          {(picked === q.correct_answer || status === "correct") ? "✓ Chính xác!" : "✗ Sai rồi"}
        </p>
      )}
      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={onPrev}><ChevronLeft size={16} /> Câu trước</Button>
        <Button variant="outline" onClick={onNext}>Câu tiếp <ChevronRight size={16} /></Button>
      </div>
    </div>
  );
}
