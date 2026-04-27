import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Award, CheckCircle2, XCircle, Save, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export type ExamMilestone = {
  key: "graduation" | "theory" | "simulation" | "track" | "road";
  label: string;
  /** null for boolean (graduation) */
  pass: number | null;
  max: number | null;
};

export const EXAM_MILESTONES: ExamMilestone[] = [
  { key: "graduation", label: "Thi tốt nghiệp", pass: null, max: null },
  { key: "theory", label: "Lý thuyết", pass: 32, max: 35 },
  { key: "simulation", label: "Mô phỏng", pass: 35, max: 50 },
  { key: "track", label: "Sa hình", pass: 80, max: 100 },
  { key: "road", label: "Đường trường", pass: 80, max: 100 },
];

export type ExamResultData = {
  graduation_passed: boolean | null;
  theory_score: number | null;
  simulation_score: number | null;
  track_score: number | null;
  road_score: number | null;
  notes: string | null;
};

const empty: ExamResultData = {
  graduation_passed: null,
  theory_score: null,
  simulation_score: null,
  track_score: null,
  road_score: null,
  notes: null,
};

function getStatus(m: ExamMilestone, data: ExamResultData): "pass" | "fail" | "pending" {
  if (m.key === "graduation") {
    if (data.graduation_passed === null) return "pending";
    return data.graduation_passed ? "pass" : "fail";
  }
  const score = (data as any)[`${m.key}_score`] as number | null;
  if (score === null || score === undefined) return "pending";
  return score >= (m.pass as number) ? "pass" : "fail";
}

function displayValue(m: ExamMilestone, data: ExamResultData): string {
  if (m.key === "graduation") {
    if (data.graduation_passed === null) return "—";
    return data.graduation_passed ? "Đậu" : "Không đậu";
  }
  const score = (data as any)[`${m.key}_score`] as number | null;
  if (score === null || score === undefined) return `—/${m.max}`;
  return `${score}/${m.max}`;
}

/** Horizontal milestone display (read-only) */
export function ExamScoresDisplay({ data }: { data: ExamResultData | null }) {
  const d = data || empty;
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="mb-5 font-semibold text-foreground flex items-center gap-2">
        <Award size={18} /> Điểm thi
      </h3>
      <div className="relative overflow-x-auto pb-2">
        <div className="flex items-start gap-2 min-w-max">
          {EXAM_MILESTONES.map((m, i) => {
            const status = getStatus(m, d);
            const color =
              status === "pass" ? "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400"
              : status === "fail" ? "border-destructive bg-destructive/10 text-destructive"
              : "border-border bg-muted/30 text-muted-foreground";
            return (
              <div key={m.key} className="flex items-center">
                <div className="flex flex-col items-center w-28">
                  <div className={cn("h-14 w-14 rounded-full border-2 flex items-center justify-center transition-all", color)}>
                    {status === "pass" ? <CheckCircle2 size={26} /> : status === "fail" ? <XCircle size={26} /> : <Award size={22} />}
                  </div>
                  <p className="mt-2 text-xs font-medium text-foreground text-center">{m.label}</p>
                  <p className={cn("text-xs font-bold mt-0.5", status === "pass" ? "text-green-600 dark:text-green-400" : status === "fail" ? "text-destructive" : "text-muted-foreground")}>
                    {displayValue(m, d)}
                  </p>
                </div>
                {i < EXAM_MILESTONES.length - 1 && (
                  <div className={cn("h-0.5 w-8 mt-7 transition-colors", status === "pass" ? "bg-green-500" : status === "fail" ? "bg-destructive/60" : "bg-border")} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      {d.notes && (
        <p className="mt-4 text-sm text-muted-foreground border-t border-border/50 pt-3">
          <span className="font-medium text-foreground">Ghi chú:</span> {d.notes}
        </p>
      )}
    </div>
  );
}

/** Hook to load exam result for a client */
export function useExamResult(clientId: string | undefined) {
  const [data, setData] = useState<ExamResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);

  const reload = async () => {
    if (!clientId) return;
    setLoading(true);
    const { data: row } = await supabase
      .from("exam_results")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle();
    if (row) {
      setExists(true);
      setData({
        graduation_passed: row.graduation_passed,
        theory_score: row.theory_score,
        simulation_score: row.simulation_score,
        track_score: row.track_score,
        road_score: row.road_score,
        notes: row.notes,
      });
    } else {
      setExists(false);
      setData(empty);
    }
    setLoading(false);
  };

  useEffect(() => { reload(); }, [clientId]);

  return { data, loading, exists, reload };
}

/** Edit form for exam scores */
export function ExamScoresEditor({
  clientId,
  userId,
  onSaved,
}: {
  clientId: string;
  userId: string;
  onSaved?: () => void;
}) {
  const { data, exists, reload, loading } = useExamResult(clientId);
  const [form, setForm] = useState<ExamResultData>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      client_id: clientId,
      graduation_passed: form.graduation_passed,
      theory_score: form.theory_score,
      simulation_score: form.simulation_score,
      track_score: form.track_score,
      road_score: form.road_score,
      notes: form.notes,
      updated_by: userId,
    };
    const { error } = exists
      ? await supabase.from("exam_results").update(payload).eq("client_id", clientId)
      : await supabase.from("exam_results").insert(payload);
    if (error) {
      toast.error("Lưu điểm thi thất bại: " + error.message);
    } else {
      toast.success("Đã lưu điểm thi!");
      await reload();
      onSaved?.();
    }
    setSaving(false);
  };

  const setScore = (key: keyof ExamResultData, raw: string) => {
    if (raw === "") {
      setForm({ ...form, [key]: null } as ExamResultData);
    } else {
      const n = parseInt(raw);
      setForm({ ...form, [key]: isNaN(n) ? null : n } as ExamResultData);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Đang tải…</p>;

  return (
    <div className="space-y-4">
      <ExamScoresDisplay data={form} />

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h4 className="font-semibold text-foreground">Cập nhật điểm</h4>

        <div>
          <Label>Thi tốt nghiệp</Label>
          <Select
            value={form.graduation_passed === null ? "" : form.graduation_passed ? "pass" : "fail"}
            onValueChange={(v) =>
              setForm({ ...form, graduation_passed: v === "pass" ? true : v === "fail" ? false : null })
            }
          >
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Chưa có kết quả" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pass">Đậu</SelectItem>
              <SelectItem value="fail">Không đậu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {EXAM_MILESTONES.filter((m) => m.key !== "graduation").map((m) => (
            <div key={m.key}>
              <Label className="text-xs">{m.label} (đậu ≥ {m.pass}/{m.max})</Label>
              <Input
                type="number"
                min={0}
                max={m.max!}
                placeholder={`/${m.max}`}
                value={(form as any)[`${m.key}_score`] ?? ""}
                onChange={(e) => setScore(`${m.key}_score` as keyof ExamResultData, e.target.value)}
                className="rounded-xl mt-1"
              />
            </div>
          ))}
        </div>

        <div>
          <Label>Ghi chú</Label>
          <Textarea
            value={form.notes || ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="rounded-xl mt-1"
            rows={3}
          />
        </div>

        <Button variant="hero" className="rounded-xl" onClick={handleSave} disabled={saving}>
          <Save size={16} /> {saving ? "Đang lưu…" : "Lưu điểm thi"}
        </Button>
      </div>
    </div>
  );
}

/** Dialog wrapper button to edit exam scores from a list view */
export function ExamScoresDialogButton({
  clientId,
  clientName,
  userId,
}: {
  clientId: string;
  clientName: string;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="icon" title="Điểm thi" onClick={() => setOpen(true)}>
        <Award size={16} />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-card max-h-[85vh] overflow-y-auto max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award size={18} /> Điểm thi — {clientName}
            </DialogTitle>
          </DialogHeader>
          <ExamScoresEditor clientId={clientId} userId={userId} />
        </DialogContent>
      </Dialog>
    </>
  );
}
