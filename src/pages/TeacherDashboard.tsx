import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TableSkeleton, EmptyState } from "@/components/shared/StatCard";
import { ChangeOwnPassword } from "@/components/shared/ChangeOwnPassword";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Users, LayoutDashboard, Save, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ExamScoresEditor } from "@/components/shared/ExamScores";
import { ViewAsStudentDialogButton } from "@/components/shared/StudentClientView";

const navItems = [
  { label: "Học viên của tôi", path: "/teacher", icon: <LayoutDashboard size={18} /> },
  { label: "Cài đặt", path: "/teacher/settings", icon: <Settings size={18} /> },
];

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    if (!profile) return;
    const fetchClients = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "client")
        .eq("teacher_id", profile.id);
      setClients(data || []);
      setLoading(false);
    };
    fetchClients();
  }, [profile]);

  return (
    <DashboardLayout navItems={navItems} roleLabel="GIÁO VIÊN" roleColor="gradient-accent text-accent-foreground">
      {selected ? (
        <StudentProgress student={selected} onBack={() => setSelected(null)} teacherId={profile?.id || ""} />
      ) : (
        <>
          <h1 className="mb-6 text-2xl font-bold text-foreground">Học viên của tôi</h1>
          {loading ? <TableSkeleton /> : clients.length === 0 ? (
            <EmptyState title="Chưa có học viên" description="Bạn chưa được phân công học viên nào" icon={<Users size={40} />} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clients.map((c) => (
                <div
                  key={c.id}
                  className="glass-card rounded-2xl p-5 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={() => setSelected(c)}>
                    <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                      {c.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{c.full_name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    {c.license_type ? (
                      <span className="gradient-primary rounded-full px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                        Hạng {c.license_type}
                      </span>
                    ) : <span />}
                    <ViewAsStudentDialogButton clientId={c.id} clientName={c.full_name} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

export function TeacherSettings() {
  return (
    <DashboardLayout navItems={navItems} roleLabel="GIÁO VIÊN" roleColor="gradient-accent text-accent-foreground">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Cài đặt</h1>
      <ChangeOwnPassword />
    </DashboardLayout>
  );
}

function StudentProgress({ student, onBack, teacherId }: { student: any; onBack: () => void; teacherId: string }) {
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    theory_score: "",
    simulation_score: "",
    road_test_score: "",
    track_test_score: "",
    notes: "",
    schedule_milestones: [] as { date: string; title: string; completed: boolean }[],
  });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("training_progress")
        .select("*")
        .eq("client_id", student.id)
        .maybeSingle();

      if (data) {
        setProgress(data);
        setForm({
          theory_score: data.theory_score?.toString() || "",
          simulation_score: data.simulation_score?.toString() || "",
          road_test_score: data.road_test_score?.toString() || "",
          track_test_score: data.track_test_score?.toString() || "",
          notes: data.notes || "",
          schedule_milestones: (data.schedule_milestones as any) || [],
        });
      } else {
        setForm({
          ...form,
          schedule_milestones: [
            { date: "", title: "Học lý thuyết", completed: false },
            { date: "", title: "Thi thử lần 1", completed: false },
            { date: "", title: "Thi sa hình", completed: false },
            { date: "", title: "Thi đường trường", completed: false },
          ],
        });
      }
      setLoading(false);
    };
    fetch();
  }, [student.id]);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      client_id: student.id,
      teacher_id: teacherId,
      theory_score: form.theory_score ? parseInt(form.theory_score) : null,
      simulation_score: form.simulation_score ? parseInt(form.simulation_score) : null,
      road_test_score: form.road_test_score ? parseInt(form.road_test_score) : null,
      track_test_score: form.track_test_score ? parseInt(form.track_test_score) : null,
      notes: form.notes,
      schedule_milestones: form.schedule_milestones,
    };

    let error;
    if (progress) {
      ({ error } = await supabase.from("training_progress").update(payload).eq("id", progress.id));
    } else {
      ({ error } = await supabase.from("training_progress").insert(payload));
    }

    if (error) toast.error("Lưu thất bại: " + error.message);
    else toast.success("Lưu thành công!");
    setSaving(false);
  };

  const scoreColor = (score: string) => {
    const s = parseInt(score);
    if (isNaN(s)) return "text-muted-foreground";
    if (s < 50) return "text-destructive";
    if (s < 80) return "text-yellow-500";
    return "text-green-500";
  };

  const toggleMilestone = (idx: number) => {
    const updated = [...form.schedule_milestones];
    updated[idx] = { ...updated[idx], completed: !updated[idx].completed };
    setForm({ ...form, schedule_milestones: updated });
  };

  if (loading) return <TableSkeleton rows={3} />;

  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-4">← Quay lại</Button>

      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-14 w-14 rounded-full gradient-primary flex items-center justify-center text-xl font-bold text-primary-foreground">
            {student.full_name?.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{student.full_name}</h2>
            <p className="text-sm text-muted-foreground">{student.email} • {student.phone || "—"}</p>
          </div>
          {student.license_type && (
            <span className="gradient-primary rounded-full px-3 py-1 text-sm font-semibold text-primary-foreground ml-auto">
              Hạng {student.license_type}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
        {[
          { key: "theory_score", label: "Lý Thuyết" },
          { key: "simulation_score", label: "Mô Phỏng" },
          { key: "track_test_score", label: "Sa Hình" },
          { key: "road_test_score", label: "Đường Trường" },
        ].map(({ key, label }) => (
          <div key={key} className="glass-card rounded-2xl p-4">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={(form as any)[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className={cn("mt-1 rounded-xl text-2xl font-bold text-center", scoreColor((form as any)[key]))}
            />
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-6 mb-6">
        <h3 className="mb-4 font-semibold text-foreground">Mốc lịch trình học</h3>
        <div className="space-y-3">
          {form.schedule_milestones.map((m, i) => (
            <div key={i} className="flex items-center gap-3">
              <Checkbox checked={m.completed} onCheckedChange={() => toggleMilestone(i)} />
              <Input
                value={m.title}
                onChange={(e) => {
                  const updated = [...form.schedule_milestones];
                  updated[i] = { ...updated[i], title: e.target.value };
                  setForm({ ...form, schedule_milestones: updated });
                }}
                className={cn("flex-1 rounded-xl", m.completed && "line-through text-muted-foreground")}
              />
              <Input
                type="date"
                value={m.date}
                onChange={(e) => {
                  const updated = [...form.schedule_milestones];
                  updated[i] = { ...updated[i], date: e.target.value };
                  setForm({ ...form, schedule_milestones: updated });
                }}
                className="w-40 rounded-xl"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 mb-6">
        <Label>Ghi chú giáo viên</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-2 rounded-xl" rows={4} />
      </div>

      <div className="mb-6">
        <h3 className="mb-3 font-semibold text-foreground">Điểm thi</h3>
        <ExamScoresEditor clientId={student.id} userId={teacherId} />
      </div>

      <Button variant="hero" size="lg" className="rounded-xl" onClick={handleSave} disabled={saving}>
        <Save size={18} />
        {saving ? "Đang lưu..." : "Lưu tiến trình"}
      </Button>
    </div>
  );
}
