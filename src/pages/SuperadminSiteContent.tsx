import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardLayout, NavItem } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Plus, Trash2, Globe, LayoutDashboard, GraduationCap, ClipboardList, MessageCircle, Pencil, Settings } from "lucide-react";

interface StatItem {
  icon: string;
  value: string;
  label: string;
}

interface CourseItem {
  type: string;
  desc: string;
  duration: string;
  fee: string;
}

interface CourseInfo {
  title: string;
  items: CourseItem[];
}

export default function SuperadminSiteContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Content state
  const [brandName, setBrandName] = useState("DriveMaster");
  const [heroTitle1, setHeroTitle1] = useState("Dễ Dàng");
  const [heroTitle2, setHeroTitle2] = useState("Tự Tin");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [stats, setStats] = useState<StatItem[]>([]);
  const [motorbikeInfo, setMotorbikeInfo] = useState<CourseInfo>({ title: "", items: [] });
  const [carInfo, setCarInfo] = useState<CourseInfo>({ title: "", items: [] });

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase.from("site_content").select("key, value");
      if (data) {
        const map: Record<string, any> = {};
        data.forEach((r: any) => { map[r.key] = r.value; });
        if (map.brand_name) setBrandName(map.brand_name);
        if (map.hero_title_1) setHeroTitle1(map.hero_title_1);
        if (map.hero_title_2) setHeroTitle2(map.hero_title_2);
        if (map.hero_subtitle) setHeroSubtitle(map.hero_subtitle);
        if (map.stats) setStats(map.stats);
        if (map.motorbike_info) setMotorbikeInfo(map.motorbike_info);
        if (map.car_info) setCarInfo(map.car_info);
      }
      setLoading(false);
    };
    fetchContent();
  }, []);

  const saveAll = async () => {
    setSaving(true);
    const entries: { key: string; value: any }[] = [
      { key: "brand_name", value: brandName },
      { key: "hero_title_1", value: heroTitle1 },
      { key: "hero_title_2", value: heroTitle2 },
      { key: "hero_subtitle", value: heroSubtitle },
      { key: "stats", value: stats },
      { key: "motorbike_info", value: motorbikeInfo },
      { key: "car_info", value: carInfo },
    ];

    let hasError = false;
    for (const entry of entries) {
      const { error } = await supabase
        .from("site_content")
        .upsert({ key: entry.key, value: entry.value, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) {
        hasError = true;
        toast.error(`Lỗi lưu ${entry.key}: ${error.message}`);
        break;
      }
    }

    if (!hasError) {
      toast.success("Đã lưu nội dung trang chủ!");
    }
    setSaving(false);
  };

  const iconOptions = ["Users", "GraduationCap", "Clock", "Award", "Bike", "Car", "Star", "Heart"];

  if (loading) {
    return <div className="p-6 text-muted-foreground">Đang tải...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Globe size={24} /> Quản lý nội dung Trang chủ
        </h1>
        <Button variant="hero" className="rounded-xl" onClick={saveAll} disabled={saving}>
          <Save size={16} />
          {saving ? "Đang lưu..." : "Lưu tất cả"}
        </Button>
      </div>

      {/* Brand & Hero */}
      <section className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">🏠 Thông tin chung</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Tên thương hiệu</Label>
            <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} className="rounded-xl" />
          </div>
          <div>
            <Label>Tiêu đề nổi bật 1 (màu xanh)</Label>
            <Input value={heroTitle1} onChange={(e) => setHeroTitle1(e.target.value)} className="rounded-xl" />
          </div>
          <div>
            <Label>Tiêu đề nổi bật 2 (màu xanh)</Label>
            <Input value={heroTitle2} onChange={(e) => setHeroTitle2(e.target.value)} className="rounded-xl" />
          </div>
        </div>
        <div>
          <Label>Mô tả phụ</Label>
          <Textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} className="rounded-xl" rows={3} />
        </div>
      </section>

      {/* Stats */}
      <section className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">📊 Thống kê nổi bật</h2>
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setStats([...stats, { icon: "Users", value: "0", label: "Mới" }])}>
            <Plus size={14} /> Thêm
          </Button>
        </div>
        {stats.map((s, i) => (
          <div key={i} className="flex items-end gap-3 border border-border/50 rounded-xl p-3">
            <div className="flex-1">
              <Label>Icon</Label>
              <select
                value={s.icon}
                onChange={(e) => { const n = [...stats]; n[i].icon = e.target.value; setStats(n); }}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              >
                {iconOptions.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <Label>Giá trị</Label>
              <Input value={s.value} onChange={(e) => { const n = [...stats]; n[i].value = e.target.value; setStats(n); }} className="rounded-xl" />
            </div>
            <div className="flex-1">
              <Label>Nhãn</Label>
              <Input value={s.label} onChange={(e) => { const n = [...stats]; n[i].label = e.target.value; setStats(n); }} className="rounded-xl" />
            </div>
            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setStats(stats.filter((_, j) => j !== i))}>
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </section>

      {/* Motorbike Courses */}
      <section className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">🏍️ Khóa học Xe máy</h2>
        <div>
          <Label>Tiêu đề</Label>
          <Input value={motorbikeInfo.title} onChange={(e) => setMotorbikeInfo({ ...motorbikeInfo, title: e.target.value })} className="rounded-xl" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Danh sách hạng</span>
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setMotorbikeInfo({ ...motorbikeInfo, items: [...motorbikeInfo.items, { type: "", desc: "", duration: "", fee: "" }] })}>
            <Plus size={14} /> Thêm hạng
          </Button>
        </div>
        {motorbikeInfo.items.map((item, i) => (
          <div key={i} className="grid grid-cols-2 md:grid-cols-5 gap-3 border border-border/50 rounded-xl p-3 items-end">
            <div><Label>Hạng</Label><Input value={item.type} onChange={(e) => { const n = { ...motorbikeInfo, items: [...motorbikeInfo.items] }; n.items[i] = { ...item, type: e.target.value }; setMotorbikeInfo(n); }} className="rounded-xl" /></div>
            <div><Label>Mô tả</Label><Input value={item.desc} onChange={(e) => { const n = { ...motorbikeInfo, items: [...motorbikeInfo.items] }; n.items[i] = { ...item, desc: e.target.value }; setMotorbikeInfo(n); }} className="rounded-xl" /></div>
            <div><Label>Thời gian</Label><Input value={item.duration} onChange={(e) => { const n = { ...motorbikeInfo, items: [...motorbikeInfo.items] }; n.items[i] = { ...item, duration: e.target.value }; setMotorbikeInfo(n); }} className="rounded-xl" /></div>
            <div><Label>Học phí</Label><Input value={item.fee} onChange={(e) => { const n = { ...motorbikeInfo, items: [...motorbikeInfo.items] }; n.items[i] = { ...item, fee: e.target.value }; setMotorbikeInfo(n); }} className="rounded-xl" /></div>
            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setMotorbikeInfo({ ...motorbikeInfo, items: motorbikeInfo.items.filter((_, j) => j !== i) })}>
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </section>

      {/* Car Courses */}
      <section className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">🚗 Khóa học Ô tô</h2>
        <div>
          <Label>Tiêu đề</Label>
          <Input value={carInfo.title} onChange={(e) => setCarInfo({ ...carInfo, title: e.target.value })} className="rounded-xl" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Danh sách hạng</span>
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setCarInfo({ ...carInfo, items: [...carInfo.items, { type: "", desc: "", duration: "", fee: "" }] })}>
            <Plus size={14} /> Thêm hạng
          </Button>
        </div>
        {carInfo.items.map((item, i) => (
          <div key={i} className="grid grid-cols-2 md:grid-cols-5 gap-3 border border-border/50 rounded-xl p-3 items-end">
            <div><Label>Hạng</Label><Input value={item.type} onChange={(e) => { const n = { ...carInfo, items: [...carInfo.items] }; n.items[i] = { ...item, type: e.target.value }; setCarInfo(n); }} className="rounded-xl" /></div>
            <div><Label>Mô tả</Label><Input value={item.desc} onChange={(e) => { const n = { ...carInfo, items: [...carInfo.items] }; n.items[i] = { ...item, desc: e.target.value }; setCarInfo(n); }} className="rounded-xl" /></div>
            <div><Label>Thời gian</Label><Input value={item.duration} onChange={(e) => { const n = { ...carInfo, items: [...carInfo.items] }; n.items[i] = { ...item, duration: e.target.value }; setCarInfo(n); }} className="rounded-xl" /></div>
            <div><Label>Học phí</Label><Input value={item.fee} onChange={(e) => { const n = { ...carInfo, items: [...carInfo.items] }; n.items[i] = { ...item, fee: e.target.value }; setCarInfo(n); }} className="rounded-xl" /></div>
            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setCarInfo({ ...carInfo, items: carInfo.items.filter((_, j) => j !== i) })}>
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </section>

      {/* Floating save button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button variant="hero" size="lg" className="rounded-2xl shadow-2xl" onClick={saveAll} disabled={saving}>
          <Save size={20} />
          {saving ? "Đang lưu..." : "Lưu tất cả"}
        </Button>
      </div>
    </div>
  );
}
