import { useEffect, useState, useRef } from "react";
import { DashboardLayout, NavItem } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, Download, Trash2, FileSpreadsheet, BookOpen, FileText, Image as ImageIcon, Eye } from "lucide-react";
import { LayoutDashboard, GraduationCap, ClipboardList, MessageCircle, Pencil, Settings, BookOpenCheck } from "lucide-react";
import { parseExcelFile, ParsedSheet, getImageUrlByName } from "@/lib/examUtils";
import { cn } from "@/lib/utils";

function useNav(): NavItem[] {
  return [
    { label: "Tổng quan", path: "/superadmin", icon: <LayoutDashboard size={18} /> },
    { label: "Tất cả người dùng", path: "/superadmin/users", icon: <GraduationCap size={18} /> },
    { label: "Lead liên hệ", path: "/superadmin/leads", icon: <ClipboardList size={18} /> },
    { label: "Hộp thư Chat", path: "/superadmin/chat", icon: <MessageCircle size={18} /> },
    { label: "Nội dung Trang chủ", path: "/superadmin/site-content", icon: <Pencil size={18} /> },
    { label: "Quản lý Câu hỏi", path: "/superadmin/questions", icon: <BookOpenCheck size={18} /> },
    { label: "Cài đặt", path: "/superadmin/settings", icon: <Settings size={18} /> },
  ];
}

export default function SuperadminQuestions() {
  return (
    <DashboardLayout navItems={useNav()} roleLabel="SUPERADMIN" roleColor="gradient-primary text-primary-foreground">
      <h1 className="mb-6 text-2xl font-bold text-foreground flex items-center gap-2">
        <BookOpenCheck size={26} /> Quản lý Câu hỏi
      </h1>
      <Tabs defaultValue="bank">
        <TabsList className="mb-4">
          <TabsTrigger value="bank">📋 Ngân hàng câu hỏi</TabsTrigger>
          <TabsTrigger value="exams">📝 Mã đề thi thử</TabsTrigger>
        </TabsList>
        <TabsContent value="bank"><QuestionBankTab /></TabsContent>
        <TabsContent value="exams"><ExamSetsTab /></TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

// ========== TAB 1: Question bank ==========
function QuestionBankTab() {
  const [sheets, setSheets] = useState<ParsedSheet[] | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadQuestions = async () => {
    const { data } = await supabase.from("questions").select("*").order("created_at", { ascending: false });
    setQuestions(data || []);
  };

  useEffect(() => { loadQuestions(); }, []);

  const handleFile = async (f: File) => {
    try {
      const parsed = await parseExcelFile(f);
      setSheets(parsed);
    } catch (e) {
      toast.error("Không đọc được file Excel");
    }
  };

  const doImport = async () => {
    if (!sheets) return;
    const allQ = sheets.flatMap((s) => s.questions).filter((q) => !q._error);
    if (allQ.length === 0) { toast.error("Không có câu hỏi hợp lệ"); return; }
    setImporting(true);
    setProgress(0);
    try {
      const rows = allQ.map((q) => ({
        question_text: q.question_text,
        answer_1: q.answer_1,
        answer_2: q.answer_2,
        answer_3: q.answer_3,
        answer_4: q.answer_4,
        image_url: q.image_filename ? getImageUrlByName(q.image_filename) : null,
        correct_answer: q.correct_answer,
      }));
      // chunk
      const chunkSize = 100;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error } = await supabase.from("questions").insert(chunk);
        if (error) throw error;
        setProgress(Math.round(((i + chunk.length) / rows.length) * 100));
      }
      toast.success(`Đã import ${rows.length} câu hỏi`);
      setSheets(null);
      if (inputRef.current) inputRef.current.value = "";
      loadQuestions();
    } catch (e: any) {
      toast.error(`Lỗi import: ${e.message}`);
    } finally {
      setImporting(false);
    }
  };

  const deleteAll = async () => {
    const { error } = await supabase.from("questions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) toast.error(error.message); else { toast.success("Đã xóa toàn bộ câu hỏi"); loadQuestions(); }
  };

  const totalQ = sheets?.reduce((sum, s) => sum + s.questions.length, 0) || 0;
  const errorQ = sheets?.reduce((sum, s) => sum + s.questions.filter((q) => q._error).length, 0) || 0;
  const previewRows = sheets?.[0]?.questions.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground flex items-center gap-2"><Upload size={18} /> Upload câu hỏi từ Excel</h3>
          <a href="/templates/mau_cau_hoi.xlsx" download>
            <Button variant="outline" size="sm"><Download size={16} className="mr-2" /> Tải file mẫu</Button>
          </a>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Cấu trúc cột: Câu hỏi | Đáp án 1 | Đáp án 2 | Đáp án 3 | Đáp án 4 (có thể trống) | Hình ảnh (tên file) | Đáp án đúng (1-4)</p>

        {/* Mini Excel preview */}
        <div className="mb-4 rounded-lg border border-border overflow-hidden bg-background/50">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border-b border-border">
            <FileSpreadsheet size={14} className="text-primary" />
            <span className="text-xs font-medium text-foreground">Ví dụ file Excel mẫu</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/60">
                <tr className="text-foreground">
                  <th className="p-1.5 w-8 text-center text-muted-foreground font-normal border-r border-border"></th>
                  <th className="p-1.5 text-left border-r border-border font-medium">A · Câu hỏi</th>
                  <th className="p-1.5 text-left border-r border-border font-medium">B · Đáp án 1</th>
                  <th className="p-1.5 text-left border-r border-border font-medium">C · Đáp án 2</th>
                  <th className="p-1.5 text-left border-r border-border font-medium">D · Đáp án 3</th>
                  <th className="p-1.5 text-left border-r border-border font-medium">E · Đáp án 4</th>
                  <th className="p-1.5 text-left border-r border-border font-medium">F · Hình ảnh</th>
                  <th className="p-1.5 text-center font-medium">G · Đúng</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-t border-border">
                  <td className="p-1.5 text-center bg-muted/40 border-r border-border">1</td>
                  <td className="p-1.5 border-r border-border">Biển báo nào là biển cấm?</td>
                  <td className="p-1.5 border-r border-border">Hình tròn viền đỏ</td>
                  <td className="p-1.5 border-r border-border">Hình tam giác</td>
                  <td className="p-1.5 border-r border-border">Hình vuông</td>
                  <td className="p-1.5 border-r border-border">Hình chữ nhật</td>
                  <td className="p-1.5 border-r border-border font-mono text-[10px]">cau001.jpg</td>
                  <td className="p-1.5 text-center font-bold text-primary">1</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-1.5 text-center bg-muted/40 border-r border-border">2</td>
                  <td className="p-1.5 border-r border-border">Tốc độ tối đa trong khu dân cư?</td>
                  <td className="p-1.5 border-r border-border">40 km/h</td>
                  <td className="p-1.5 border-r border-border">50 km/h</td>
                  <td className="p-1.5 border-r border-border">60 km/h</td>
                  <td className="p-1.5 border-r border-border italic text-muted-foreground/60">(trống)</td>
                  <td className="p-1.5 border-r border-border italic text-muted-foreground/60">(trống)</td>
                  <td className="p-1.5 text-center font-bold text-primary">2</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="px-3 py-1.5 text-[11px] text-muted-foreground bg-muted/30 border-t border-border">💡 Cột Đáp án 4 và Hình ảnh có thể để trống. Cột Đáp án đúng nhập số 1-4.</p>
        </div>

        <label className="block border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors">
          <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <FileSpreadsheet size={40} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-foreground font-medium">Kéo thả file .xlsx hoặc click để chọn</p>
        </label>

        {sheets && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium text-foreground">Đọc được: {totalQ} câu</span>
              {errorQ > 0 && <span className="text-destructive">⚠ {errorQ} câu lỗi sẽ bị bỏ qua</span>}
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr><th className="p-2 text-left">#</th><th className="p-2 text-left">Câu hỏi</th><th className="p-2 text-left">Đáp án đúng</th><th className="p-2 text-left">Trạng thái</th></tr>
                </thead>
                <tbody>
                  {previewRows.map((q, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2 max-w-md truncate">{q.question_text}</td>
                      <td className="p-2">{q.correct_answer}</td>
                      <td className="p-2">{q._error ? <span className="text-destructive">{q._error}</span> : <span className="text-green-500">OK</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {importing && <Progress value={progress} />}
            <div className="flex gap-2">
              <Button onClick={doImport} disabled={importing} variant="hero">🚀 Import {totalQ - errorQ} câu hỏi</Button>
              <Button variant="outline" onClick={() => { setSheets(null); if (inputRef.current) inputRef.current.value = ""; }}>Hủy</Button>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground">Ngân hàng hiện có ({questions.length} câu)</h3>
          {questions.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 size={16} className="mr-2" /> Xóa tất cả</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Xóa toàn bộ câu hỏi?</AlertDialogTitle><AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={deleteAll}>Xác nhận xóa</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Chưa có câu hỏi nào</p>
        ) : (
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0"><tr><th className="p-2 text-left">#</th><th className="p-2 text-left">Câu hỏi</th><th className="p-2 text-center">Số đáp án</th><th className="p-2 text-center">Ảnh</th><th className="p-2 text-center">Đáp án đúng</th></tr></thead>
              <tbody>
                {questions.map((q, i) => (
                  <tr key={q.id} className="border-t border-border">
                    <td className="p-2">{i + 1}</td>
                    <td className="p-2 max-w-md truncate">{q.question_text}</td>
                    <td className="p-2 text-center">{[q.answer_1, q.answer_2, q.answer_3, q.answer_4].filter(Boolean).length}</td>
                    <td className="p-2 text-center">{q.image_url ? <ImageIcon size={14} className="inline text-primary" /> : "—"}</td>
                    <td className="p-2 text-center font-bold text-primary">{q.correct_answer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== TAB 2: Exam sets ==========
function ExamSetsTab() {
  const [sheets, setSheets] = useState<ParsedSheet[] | null>(null);
  const [examSets, setExamSets] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [viewSet, setViewSet] = useState<any | null>(null);
  const [viewQs, setViewQs] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadExamSets = async () => {
    const { data } = await supabase.from("exam_sets").select("*, exam_set_questions(count)").order("created_at", { ascending: false });
    setExamSets(data || []);
  };
  useEffect(() => { loadExamSets(); }, []);

  const handleFile = async (f: File) => {
    try {
      const parsed = await parseExcelFile(f);
      setSheets(parsed);
    } catch { toast.error("Không đọc được file"); }
  };

  const doImport = async () => {
    if (!sheets) return;
    const validSheets = sheets.filter((s) => s.questions.some((q) => !q._error));
    if (validSheets.length === 0) { toast.error("Không có sheet hợp lệ"); return; }
    setImporting(true);
    setProgress(0);
    try {
      let total = 0;
      for (let s = 0; s < validSheets.length; s++) {
        const sheet = validSheets[s];
        const { data: created, error: e1 } = await supabase.from("exam_sets").insert({ name: sheet.name }).select().single();
        if (e1) throw e1;
        const valid = sheet.questions.filter((q) => !q._error);
        const rows = valid.map((q, idx) => ({
          exam_set_id: created.id,
          question_text: q.question_text,
          answer_1: q.answer_1, answer_2: q.answer_2,
          answer_3: q.answer_3, answer_4: q.answer_4,
          image_url: q.image_filename ? getImageUrlByName(q.image_filename) : null,
          correct_answer: q.correct_answer,
          order_index: idx,
        }));
        if (rows.length > 0) {
          const { error: e2 } = await supabase.from("exam_set_questions").insert(rows);
          if (e2) throw e2;
        }
        total += rows.length;
        setProgress(Math.round(((s + 1) / validSheets.length) * 100));
      }
      toast.success(`Đã import ${validSheets.length} mã đề với ${total} câu hỏi`);
      setSheets(null);
      if (inputRef.current) inputRef.current.value = "";
      loadExamSets();
    } catch (e: any) {
      toast.error(`Lỗi: ${e.message}`);
    } finally { setImporting(false); }
  };

  const deleteSet = async (id: string) => {
    const { error } = await supabase.from("exam_sets").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Đã xóa mã đề"); loadExamSets(); }
  };
  const deleteAll = async () => {
    const ids = examSets.map((s) => s.id);
    if (ids.length === 0) return;
    const { error } = await supabase.from("exam_sets").delete().in("id", ids);
    if (error) toast.error(error.message); else { toast.success("Đã xóa tất cả mã đề"); loadExamSets(); }
  };

  const openView = async (set: any) => {
    setViewSet(set);
    const { data } = await supabase.from("exam_set_questions").select("*").eq("exam_set_id", set.id).order("order_index");
    setViewQs(data || []);
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground flex items-center gap-2"><Upload size={18} /> Upload mã đề (mỗi sheet = 1 đề)</h3>
          <a href="/templates/mau_de_thi.xlsx" download><Button variant="outline" size="sm"><Download size={16} className="mr-2" /> Tải file mẫu</Button></a>
        </div>
        <p className="text-sm text-muted-foreground mb-3">File Excel có nhiều sheet, tên sheet = tên mã đề (vd "Đề 01"). Cột giống ngân hàng câu hỏi.</p>

        {/* Mini Excel preview with multiple sheets */}
        <div className="mb-4 rounded-lg border border-border overflow-hidden bg-background/50">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border-b border-border">
            <FileSpreadsheet size={14} className="text-primary" />
            <span className="text-xs font-medium text-foreground">Ví dụ file Excel mẫu (mỗi sheet = 1 mã đề)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/60">
                <tr>
                  <th className="p-1.5 w-8 text-center text-muted-foreground font-normal border-r border-border"></th>
                  <th className="p-1.5 text-left border-r border-border font-medium">A · Câu hỏi</th>
                  <th className="p-1.5 text-left border-r border-border font-medium">B · Đáp án 1</th>
                  <th className="p-1.5 text-left border-r border-border font-medium">C · Đáp án 2</th>
                  <th className="p-1.5 text-left border-r border-border font-medium">D · Đáp án 3</th>
                  <th className="p-1.5 text-left border-r border-border font-medium">E · Đáp án 4</th>
                  <th className="p-1.5 text-left border-r border-border font-medium">F · Hình ảnh</th>
                  <th className="p-1.5 text-center font-medium">G · Đúng</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-t border-border">
                  <td className="p-1.5 text-center bg-muted/40 border-r border-border">1</td>
                  <td className="p-1.5 border-r border-border">Khi đèn vàng bật sáng, người lái xe phải?</td>
                  <td className="p-1.5 border-r border-border">Dừng trước vạch</td>
                  <td className="p-1.5 border-r border-border">Tăng tốc qua</td>
                  <td className="p-1.5 border-r border-border">Rẽ phải</td>
                  <td className="p-1.5 border-r border-border italic text-muted-foreground/60">(trống)</td>
                  <td className="p-1.5 border-r border-border italic text-muted-foreground/60">(trống)</td>
                  <td className="p-1.5 text-center font-bold text-primary">1</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-1.5 text-center bg-muted/40 border-r border-border">2</td>
                  <td className="p-1.5 border-r border-border">Khoảng cách an toàn ở 60 km/h?</td>
                  <td className="p-1.5 border-r border-border">15m</td>
                  <td className="p-1.5 border-r border-border">35m</td>
                  <td className="p-1.5 border-r border-border">55m</td>
                  <td className="p-1.5 border-r border-border">75m</td>
                  <td className="p-1.5 border-r border-border font-mono text-[10px]">cau002.jpg</td>
                  <td className="p-1.5 text-center font-bold text-primary">2</td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Sheet tabs mimic Excel */}
          <div className="flex items-center gap-1 px-2 py-1 bg-muted/40 border-t border-border overflow-x-auto">
            <span className="text-[10px] text-muted-foreground mr-1">Sheets:</span>
            <span className="px-2 py-0.5 text-[10px] rounded bg-background border border-border font-medium text-foreground">Đề 01</span>
            <span className="px-2 py-0.5 text-[10px] rounded text-muted-foreground">Đề 02</span>
            <span className="px-2 py-0.5 text-[10px] rounded text-muted-foreground">Đề 03</span>
            <span className="px-2 py-0.5 text-[10px] rounded text-muted-foreground">Đề 04</span>
            <span className="text-[10px] text-muted-foreground ml-1">…</span>
          </div>
          <p className="px-3 py-1.5 text-[11px] text-muted-foreground bg-muted/30 border-t border-border">💡 Mỗi sheet sẽ tạo ra 1 mã đề riêng. Tên sheet chính là tên mã đề hiển thị cho học viên.</p>
        </div>

        <label className="block border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors">
          <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <FileSpreadsheet size={40} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-foreground font-medium">Kéo thả hoặc click chọn .xlsx</p>
        </label>

        {sheets && (
          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              {sheets.map((s, i) => (
                <div key={i} className="flex justify-between text-sm bg-muted rounded p-2">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground">{s.questions.filter((q) => !q._error).length}/{s.questions.length} câu hợp lệ</span>
                </div>
              ))}
            </div>
            {importing && <Progress value={progress} />}
            <div className="flex gap-2">
              <Button onClick={doImport} disabled={importing} variant="hero">🚀 Import {sheets.length} mã đề</Button>
              <Button variant="outline" onClick={() => { setSheets(null); if (inputRef.current) inputRef.current.value = ""; }}>Hủy</Button>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground">Danh sách mã đề ({examSets.length})</h3>
          {examSets.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 size={16} className="mr-2" /> Xóa tất cả</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Xóa tất cả mã đề?</AlertDialogTitle><AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={deleteAll}>Xác nhận</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        {examSets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Chưa có mã đề nào</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {examSets.map((s) => (
              <div key={s.id} className="rounded-xl border border-border p-4 bg-card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.exam_set_questions?.[0]?.count || 0} câu • {new Date(s.created_at).toLocaleDateString("vi-VN")}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openView(s)}><Eye size={14} className="mr-1" /> Xem</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 size={14} /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Xóa "{s.name}"?</AlertDialogTitle></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={() => deleteSet(s.id)}>Xóa</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!viewSet} onOpenChange={(o) => !o && setViewSet(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{viewSet?.name} — {viewQs.length} câu</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {viewQs.map((q, i) => (
              <div key={q.id} className="rounded-lg border border-border p-3">
                <p className="font-medium text-sm mb-2">{i + 1}. {q.question_text}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                  {[q.answer_1, q.answer_2, q.answer_3, q.answer_4].map((a, j) => a && (
                    <div key={j} className={cn("p-1.5 rounded", q.correct_answer === j + 1 && "bg-green-500/20 text-green-700 dark:text-green-300 font-medium")}>{String.fromCharCode(65 + j)}. {a}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
