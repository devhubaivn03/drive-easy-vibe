import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Building2, Pencil, Plus } from "lucide-react";
import { useSuperadminNav } from "@/hooks/useRoleNav";

interface Branch {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export default function SuperadminBranches() {
  const navItems = useSuperadminNav();
  const [rows, setRows] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState({ name: "", code: "", address: "", phone: "", is_active: true });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("branches").select("*").order("created_at", { ascending: true });
    setRows((data as Branch[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", code: "", address: "", phone: "", is_active: true });
    setOpen(true);
  };
  const openEdit = (b: Branch) => {
    setEditing(b);
    setForm({ name: b.name, code: b.code || "", address: b.address || "", phone: b.phone || "", is_active: b.is_active });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Tên chi nhánh không được trống");
    const payload = {
      name: form.name.trim(),
      code: form.code.trim() || null,
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
      is_active: form.is_active,
    };
    const { error } = editing
      ? await supabase.from("branches").update(payload).eq("id", editing.id)
      : await supabase.from("branches").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Đã cập nhật" : "Đã tạo chi nhánh");
    setOpen(false);
    load();
  };

  return (
    <DashboardLayout navItems={navItems} roleLabel="Superadmin" roleColor="bg-primary text-primary-foreground">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="text-primary" /> Quản lý Chi nhánh
          </h1>
          <p className="text-sm text-muted-foreground">Tạo và quản lý các chi nhánh của hệ thống</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus size={16} /> Chi nhánh mới</Button>
      </div>

      <div className="glass-card rounded-2xl p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border/50">
              <th className="py-2 px-3">Tên</th>
              <th className="py-2 px-3">Mã</th>
              <th className="py-2 px-3">Địa chỉ</th>
              <th className="py-2 px-3">SĐT</th>
              <th className="py-2 px-3">Trạng thái</th>
              <th className="py-2 px-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Đang tải...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Chưa có chi nhánh</td></tr>
            ) : rows.map((b) => (
              <tr key={b.id} className="border-b border-border/30 hover:bg-muted/30">
                <td className="py-2 px-3 font-medium text-foreground">{b.name}</td>
                <td className="py-2 px-3 text-muted-foreground">{b.code || "-"}</td>
                <td className="py-2 px-3 text-muted-foreground">{b.address || "-"}</td>
                <td className="py-2 px-3 text-muted-foreground">{b.phone || "-"}</td>
                <td className="py-2 px-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${b.is_active ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                    {b.is_active ? "Hoạt động" : "Tạm dừng"}
                  </span>
                </td>
                <td className="py-2 px-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(b)}><Pencil size={14} /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa chi nhánh" : "Thêm chi nhánh"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tên chi nhánh *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ninh Thuận" />
            </div>
            <div>
              <Label>Mã (tùy chọn)</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="ninh-thuan" />
            </div>
            <div>
              <Label>Địa chỉ</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <Label>Số điện thoại</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Đang hoạt động</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
              <Button onClick={save}>Lưu</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}