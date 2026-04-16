import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";

export interface ParsedQuestion {
  question_text: string;
  answer_1: string;
  answer_2: string;
  answer_3: string | null;
  answer_4: string | null;
  image_filename: string | null;
  correct_answer: number;
  _error?: string;
}

export interface ParsedSheet {
  name: string;
  questions: ParsedQuestion[];
}

const COL_MAP: Record<string, keyof ParsedQuestion | "image_filename"> = {
  "câu hỏi": "question_text",
  "đáp án 1": "answer_1",
  "đáp án 2": "answer_2",
  "đáp án 3": "answer_3",
  "đáp án 4": "answer_4",
  "hình ảnh": "image_filename",
  "đáp án đúng": "correct_answer",
};

export function parseSheetRows(rows: any[][]): ParsedQuestion[] {
  if (!rows || rows.length < 2) return [];
  const header = rows[0].map((h) => String(h || "").trim().toLowerCase());
  const idx: Record<string, number> = {};
  header.forEach((h, i) => {
    if (COL_MAP[h]) idx[COL_MAP[h] as string] = i;
  });

  const out: ParsedQuestion[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => c === undefined || c === null || c === "")) continue;
    const get = (k: string) => {
      const i = idx[k];
      if (i === undefined) return null;
      const v = row[i];
      return v === undefined || v === null || v === "" ? null : String(v).trim();
    };
    const question_text = get("question_text") || "";
    const a1 = get("answer_1") || "";
    const a2 = get("answer_2") || "";
    const a3 = get("answer_3");
    const a4 = get("answer_4");
    const image_filename = get("image_filename");
    const correctRaw = get("correct_answer");
    const correct = correctRaw ? parseInt(correctRaw, 10) : NaN;

    let _error: string | undefined;
    if (!question_text) _error = "Thiếu nội dung câu hỏi";
    else if (!a1 || !a2) _error = "Thiếu đáp án 1 hoặc 2";
    else if (![1, 2, 3, 4].includes(correct)) _error = "Đáp án đúng phải là 1-4";

    out.push({
      question_text,
      answer_1: a1,
      answer_2: a2,
      answer_3: a3,
      answer_4: a4,
      image_filename,
      correct_answer: correct,
      _error,
    });
  }
  return out;
}

export async function parseExcelFile(file: File): Promise<ParsedSheet[]> {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: "array" });
  return wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, blankrows: false });
    return { name, questions: parseSheetRows(rows) };
  });
}

export async function uploadQuestionImage(file: File, filename: string): Promise<string | null> {
  const ext = filename.split(".").pop() || "jpg";
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${Date.now()}_${safeName}`;
  const { error } = await supabase.storage.from("question-images").upload(path, file, { upsert: true });
  if (error) return null;
  const { data } = supabase.storage.from("question-images").getPublicUrl(path);
  return data.publicUrl;
}

export function getImageUrlByName(filename: string): string {
  const { data } = supabase.storage.from("question-images").getPublicUrl(filename);
  return data.publicUrl;
}
