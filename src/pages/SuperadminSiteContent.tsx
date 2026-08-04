import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useSuperadminNav } from "@/hooks/useRoleNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ImageSlotEditor } from "@/components/shared/ImageSlotEditor";
import { toast } from "sonner";
import {
  Save, Plus, Trash2, Globe, Info, Wrench, Image as ImageIcon, FileText, Phone,
  Home, BookOpen, Menu as MenuIcon, ExternalLink,
} from "lucide-react";

/* ─── Kiểu dữ liệu ─── */
interface StatItem { icon: string; value: string; label: string; }
interface CourseItem { type: string; desc: string; duration: string; fee: string; }
interface CourseInfo { title: string; items: CourseItem[]; }
interface AboutHighlight { icon: string; title: string; desc: string; }
interface AboutInfo { title: string; description: string; highlights: AboutHighlight[]; }
interface ServiceItem { icon: string; title: string; desc: string; }
interface ServicesInfo { title: string; items: ServiceItem[]; }
interface GallerySlot { urls: string[]; caption: string; }
interface GalleryInfo { title: string; images: GallerySlot[]; }
interface DocumentItem { title: string; desc: string; url: string; }
interface DocumentsInfo { title: string; items: DocumentItem[]; }
interface ContactInfo { title: string; address: string; phone: string; email: string; hours: string; }

const NAV_ITEMS = [
  { id: "home", def: "Trang chủ" },
  { id: "about", def: "Giới thiệu" },
  { id: "courses", def: "Khóa học" },
  { id: "services", def: "Dịch vụ" },
  { id: "gallery", def: "Hình ảnh" },
  { id: "documents", def: "Tài liệu" },
  { id: "contact", def: "Liên hệ" },
];

const ICON_OPTIONS = ["Users", "GraduationCap", "Clock", "Award", "Bike", "Car", "Star", "Heart", "Wrench", "FileText", "ImageIcon", "Info", "BookOpen", "Phone", "Mail", "MapPin", "Download"];

function toUrls(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  if (Array.isArray(v.urls)) return v.urls.filter(Boolean);
  if (Array.isArray(v.images)) return v.images.filter(Boolean);
  if (typeof v.url === "string" && v.url) return [v.url];
  if (typeof v === "string") return [v];
  return [];
}

function SectionCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="glass-card rounded-2xl p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {desc && <p className="text-xs text-muted-foreground mt-1">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

export default function SuperadminSiteContent() {
  const navItems = useSuperadminNav();
  return (
    <DashboardLayout navItems={navItems} roleLabel="SUPERADMIN" roleColor="gradient-primary text-primary-foreground">
      <SiteContentEditor />
    </DashboardLayout>
  );
}

function SiteContentEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [brandName, setBrandName] = useState("DriveMaster");
  const [heroTitle1, setHeroTitle1] = useState("Dễ Dàng");
  const [heroTitle2, setHeroTitle2] = useState("Tự Tin");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroMedia, setHeroMedia] = useState<string[]>([]);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [navLabels, setNavLabels] = useState<Record<string, string>>({});
  const [navHidden, setNavHidden] = useState<Record<string, boolean>>({});
  const [motorbikeInfo, setMotorbikeInfo] = useState<CourseInfo>({ title: "", items: [] });
  const [carInfo, setCarInfo] = useState<CourseInfo>({ title: "", items: [] });
  const [coursesMedia, setCoursesMedia] = useState<string[]>([]);
  const [aboutInfo, setAboutInfo] = useState<AboutInfo>({ title: "Về chúng tôi", description: "", highlights: [] });
  const [aboutMedia, setAboutMedia] = useState<string[]>([]);
  const [servicesInfo, setServicesInfo] = useState<ServicesInfo>({ title: "Dịch vụ", items: [] });
  const [servicesMedia, setServicesMedia] = useState<string[]>([]);
  const [galleryInfo, setGalleryInfo] = useState<GalleryInfo>({ title: "Hình ảnh", images: [] });
  const [documentsInfo, setDocumentsInfo] = useState<DocumentsInfo>({ title: "Tài liệu", items: [] });
  const [contactInfo, setContactInfo] = useState<ContactInfo>({ title: "Liên hệ", address: "", phone: "", email: "", hours: "" });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_content").select("key, value");
      if (data) {
        const map: Record<string, any> = {};
        data.forEach((r: any) => { map[r.key] = r.value; });
        if (map.brand_name) setBrandName(map.brand_name);
        if (map.hero_title_1) setHeroTitle1(map.hero_title_1);
        if (map.hero_title_2) setHeroTitle2(map.hero_title_2);
        if (map.hero_subtitle) setHeroSubtitle(map.hero_subtitle);
        if (map.hero_media) setHeroMedia(toUrls(map.hero_media));
        if (map.stats) setStats(map.stats);
        if (map.nav_labels) setNavLabels(map.nav_labels);
        if (map.nav_hidden) setNavHidden(map.nav_hidden);
        if (map.motorbike_info) setMotorbikeInfo(map.motorbike_info);
        if (map.car_info) setCarInfo(map.car_info);
        if (map.courses_media) setCoursesMedia(toUrls(map.courses_media));
        if (map.about_info) setAboutInfo(map.about_info);
        if (map.about_media) setAboutMedia(toUrls(map.about_media));
        if (map.services_info) setServicesInfo(map.services_info);
        if (map.services_media) setServicesMedia(toUrls(map.services_media));
        if (map.gallery_info) {
          setGalleryInfo({
            title: map.gallery_info.title || "Hình ảnh",
            images: (map.gallery_info.images || []).map((g: any) => ({ urls: toUrls(g), caption: g.caption || "" })),
          });
        }
        if (map.documents_info) setDocumentsInfo(map.documents_info);
        if (map.contact_info) setContactInfo(map.contact_info);
      }
      setLoading(false);
    })();
  }, []);

  const saveAll = async () => {
    setSaving(true);
    const entries: { key: string; value: any }[] = [
      { key: "brand_name", value: brandName },
      { key: "hero_title_1", value: heroTitle1 },
      { key: "hero_title_2", value: heroTitle2 },
      { key: "hero_subtitle", value: heroSubtitle },
      { key: "hero_media", value: { images: heroMedia } },
      { key: "stats", value: stats },
      { key: "nav_labels", value: navLabels },
      { key: "nav_hidden", value: navHidden },
      { key: "motorbike_info", value: motorbikeInfo },
      { key: "car_info", value: carInfo },
      { key: "courses_media", value: { images: coursesMedia } },
      { key: "about_info", value: aboutInfo },
      { key: "about_media", value: { images: aboutMedia } },
      { key: "services_info", value: servicesInfo },
      { key: "services_media", value: { images: servicesMedia } },
      { key: "gallery_info", value: galleryInfo },
      { key: "documents_info", value: documentsInfo },
      { key: "contact_info", value: contactInfo },
    ];

    for (const entry of entries) {
      const { error } = await supabase
        .from("site_content")
        .upsert({ key: entry.key, value: entry.value, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) {
        toast.error(`Lỗi lưu ${entry.key}: ${error.message}`);
        setSaving(false);
        return;
      }
    }
    toast.success("Đã lưu nội dung trang chủ!");
    setSaving(false);
  };

  if (loading) return <div className="p-6 text-muted-foreground">Đang tải...</div>;

  const IconSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
      {ICON_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Globe size={24} /> Nội dung Trang chủ
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mọi nội dung hiển thị ở trang chủ (khi chưa đăng nhập) đều được tùy biến tại đây. Chọn từng thẻ bên dưới để chỉnh sửa, sau đó nhấn <b>Lưu tất cả</b>.
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/" target="_blank" rel="noreferrer">
            <Button variant="outline" className="rounded-xl"><ExternalLink size={16} /> Xem trang chủ</Button>
          </a>
          <Button variant="hero" className="rounded-xl" onClick={saveAll} disabled={saving}>
            <Save size={16} /> {saving ? "Đang lưu..." : "Lưu tất cả"}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
        💡 <b>Mẹo về ảnh:</b> mỗi "ô hình" có thể chứa nhiều ảnh. Nếu ô có <b>từ 2 ảnh trở lên</b>, trang chủ sẽ <b>tự động đổi ảnh mỗi 2 giây</b>. Dùng mũi tên ◀ ▶ để đổi thứ tự ảnh.
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl p-1">
          <TabsTrigger value="general" className="rounded-xl"><Home size={14} className="mr-1" /> Chung &amp; Banner</TabsTrigger>
          <TabsTrigger value="menu" className="rounded-xl"><MenuIcon size={14} className="mr-1" /> Menu điều hướng</TabsTrigger>
          <TabsTrigger value="about" className="rounded-xl"><Info size={14} className="mr-1" /> Giới thiệu</TabsTrigger>
          <TabsTrigger value="courses" className="rounded-xl"><BookOpen size={14} className="mr-1" /> Khóa học</TabsTrigger>
          <TabsTrigger value="services" className="rounded-xl"><Wrench size={14} className="mr-1" /> Dịch vụ</TabsTrigger>
          <TabsTrigger value="gallery" className="rounded-xl"><ImageIcon size={14} className="mr-1" /> Hình ảnh</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-xl"><FileText size={14} className="mr-1" /> Tài liệu</TabsTrigger>
          <TabsTrigger value="contact" className="rounded-xl"><Phone size={14} className="mr-1" /> Liên hệ</TabsTrigger>
        </TabsList>

        {/* ─────────── Chung & Banner ─────────── */}
        <TabsContent value="general" className="space-y-6 mt-4">
          <SectionCard title="🏠 Thương hiệu & Tiêu đề lớn" desc="Dòng chữ lớn nhất ở đầu trang chủ: “Học Lái Xe — [Tiêu đề 1] & [Tiêu đề 2]”.">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Tên thương hiệu</Label>
                <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} className="rounded-xl" />
                <p className="text-[11px] text-muted-foreground mt-1">Hiện ở góc trên trái và cuối trang.</p>
              </div>
              <div>
                <Label>Tiêu đề nổi bật 1</Label>
                <Input value={heroTitle1} onChange={(e) => setHeroTitle1(e.target.value)} className="rounded-xl" />
              </div>
              <div>
                <Label>Tiêu đề nổi bật 2</Label>
                <Input value={heroTitle2} onChange={(e) => setHeroTitle2(e.target.value)} className="rounded-xl" />
              </div>
            </div>
            <div>
              <Label>Mô tả phụ dưới tiêu đề</Label>
              <Textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} className="rounded-xl" rows={3} />
            </div>
          </SectionCard>

          <SectionCard title="🖼️ Ảnh minh họa Banner đầu trang" desc="Ảnh lớn nằm bên phải tiêu đề (khuyến nghị ảnh ngang 4:3, ví dụ xe tập lái, sân tập, học viên).">
            <ImageSlotEditor label="Ô hình Banner" hint="Nhiều ảnh → tự chạy slideshow mỗi 2 giây." value={heroMedia} onChange={setHeroMedia} />
          </SectionCard>

          <SectionCard title="📊 Thống kê nổi bật" desc="4 ô số liệu bên dưới banner (số học viên, tỷ lệ đậu...).">
            <Button size="sm" variant="outline" className="rounded-xl"
              onClick={() => setStats([...stats, { icon: "Users", value: "0", label: "Mới" }])}>
              <Plus size={14} /> Thêm ô thống kê
            </Button>
            {stats.map((s, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-4 items-end gap-3 border border-border/50 rounded-xl p-3">
                <div><Label>Icon</Label><IconSelect value={s.icon} onChange={(v) => { const n = [...stats]; n[i] = { ...s, icon: v }; setStats(n); }} /></div>
                <div><Label>Giá trị</Label><Input value={s.value} onChange={(e) => { const n = [...stats]; n[i] = { ...s, value: e.target.value }; setStats(n); }} className="rounded-xl" /></div>
                <div><Label>Nhãn</Label><Input value={s.label} onChange={(e) => { const n = [...stats]; n[i] = { ...s, label: e.target.value }; setStats(n); }} className="rounded-xl" /></div>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setStats(stats.filter((_, j) => j !== i))}>
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </SectionCard>
        </TabsContent>

        {/* ─────────── Menu ─────────── */}
        <TabsContent value="menu" className="space-y-6 mt-4">
          <SectionCard title="🧭 Menu trên trang chủ" desc="Đổi tên hoặc ẩn từng mục trên thanh menu (Trang chủ, Giới thiệu, Khóa học...). Tắt công tắc để ẩn mục đó khỏi menu.">
            {NAV_ITEMS.map((n) => (
              <div key={n.id} className="flex items-center gap-4 border border-border/50 rounded-xl p-3">
                <div className="flex-1">
                  <Label>Mục “{n.def}”</Label>
                  <Input
                    value={navLabels[n.id] ?? n.def}
                    onChange={(e) => setNavLabels({ ...navLabels, [n.id]: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[11px] text-muted-foreground">{navHidden[n.id] ? "Đang ẩn" : "Đang hiện"}</span>
                  <Switch checked={!navHidden[n.id]} onCheckedChange={(v) => setNavHidden({ ...navHidden, [n.id]: !v })} />
                </div>
              </div>
            ))}
          </SectionCard>
        </TabsContent>

        {/* ─────────── Giới thiệu ─────────── */}
        <TabsContent value="about" className="space-y-6 mt-4">
          <SectionCard title="ℹ️ Phần Giới thiệu" desc="Tiêu đề, mô tả và các điểm nổi bật của trung tâm.">
            <div><Label>Tiêu đề</Label><Input value={aboutInfo.title} onChange={(e) => setAboutInfo({ ...aboutInfo, title: e.target.value })} className="rounded-xl" /></div>
            <div><Label>Mô tả</Label><Textarea rows={3} value={aboutInfo.description} onChange={(e) => setAboutInfo({ ...aboutInfo, description: e.target.value })} className="rounded-xl" /></div>
            <ImageSlotEditor label="Ô hình phần Giới thiệu" hint="Ảnh hiển thị bên cạnh các điểm nổi bật." value={aboutMedia} onChange={setAboutMedia} />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Điểm nổi bật</span>
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setAboutInfo({ ...aboutInfo, highlights: [...aboutInfo.highlights, { icon: "Award", title: "", desc: "" }] })}>
                <Plus size={14} /> Thêm
              </Button>
            </div>
            {aboutInfo.highlights.map((h, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 border border-border/50 rounded-xl p-3 items-end">
                <div><Label>Icon</Label><IconSelect value={h.icon} onChange={(v) => { const hs = [...aboutInfo.highlights]; hs[i] = { ...h, icon: v }; setAboutInfo({ ...aboutInfo, highlights: hs }); }} /></div>
                <div><Label>Tiêu đề</Label><Input value={h.title} onChange={(e) => { const hs = [...aboutInfo.highlights]; hs[i] = { ...h, title: e.target.value }; setAboutInfo({ ...aboutInfo, highlights: hs }); }} className="rounded-xl" /></div>
                <div><Label>Mô tả</Label><Input value={h.desc} onChange={(e) => { const hs = [...aboutInfo.highlights]; hs[i] = { ...h, desc: e.target.value }; setAboutInfo({ ...aboutInfo, highlights: hs }); }} className="rounded-xl" /></div>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setAboutInfo({ ...aboutInfo, highlights: aboutInfo.highlights.filter((_, j) => j !== i) })}>
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </SectionCard>
        </TabsContent>

        {/* ─────────── Khóa học ─────────── */}
        <TabsContent value="courses" className="space-y-6 mt-4">
          <SectionCard title="🖼️ Ảnh phần Khóa học" desc="Ảnh băng ngang phía trên danh sách khóa học.">
            <ImageSlotEditor label="Ô hình Khóa học" value={coursesMedia} onChange={setCoursesMedia} />
          </SectionCard>

          {([["🏍️ Khóa học Xe máy", motorbikeInfo, setMotorbikeInfo], ["🚗 Khóa học Ô tô", carInfo, setCarInfo]] as const).map(([title, info, setInfo]) => (
            <SectionCard key={title} title={title} desc="Mỗi dòng là một hạng bằng, hiển thị cả ở trang chủ và trong cửa sổ chi tiết.">
              <div><Label>Tiêu đề</Label><Input value={info.title} onChange={(e) => setInfo({ ...info, title: e.target.value })} className="rounded-xl" /></div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Danh sách hạng</span>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setInfo({ ...info, items: [...info.items, { type: "", desc: "", duration: "", fee: "" }] })}>
                  <Plus size={14} /> Thêm hạng
                </Button>
              </div>
              {info.items.map((item, i) => (
                <div key={i} className="grid grid-cols-2 md:grid-cols-5 gap-3 border border-border/50 rounded-xl p-3 items-end">
                  <div><Label>Hạng</Label><Input value={item.type} onChange={(e) => { const its = [...info.items]; its[i] = { ...item, type: e.target.value }; setInfo({ ...info, items: its }); }} className="rounded-xl" /></div>
                  <div><Label>Mô tả</Label><Input value={item.desc} onChange={(e) => { const its = [...info.items]; its[i] = { ...item, desc: e.target.value }; setInfo({ ...info, items: its }); }} className="rounded-xl" /></div>
                  <div><Label>Thời gian</Label><Input value={item.duration} onChange={(e) => { const its = [...info.items]; its[i] = { ...item, duration: e.target.value }; setInfo({ ...info, items: its }); }} className="rounded-xl" /></div>
                  <div><Label>Học phí</Label><Input value={item.fee} onChange={(e) => { const its = [...info.items]; its[i] = { ...item, fee: e.target.value }; setInfo({ ...info, items: its }); }} className="rounded-xl" /></div>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setInfo({ ...info, items: info.items.filter((_, j) => j !== i) })}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </SectionCard>
          ))}
        </TabsContent>

        {/* ─────────── Dịch vụ ─────────── */}
        <TabsContent value="services" className="space-y-6 mt-4">
          <SectionCard title="🛠️ Phần Dịch vụ" desc="Các thẻ dịch vụ của trung tâm.">
            <div><Label>Tiêu đề</Label><Input value={servicesInfo.title} onChange={(e) => setServicesInfo({ ...servicesInfo, title: e.target.value })} className="rounded-xl" /></div>
            <ImageSlotEditor label="Ô hình phần Dịch vụ" value={servicesMedia} onChange={setServicesMedia} />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Danh sách dịch vụ</span>
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setServicesInfo({ ...servicesInfo, items: [...servicesInfo.items, { icon: "Wrench", title: "", desc: "" }] })}>
                <Plus size={14} /> Thêm
              </Button>
            </div>
            {servicesInfo.items.map((it, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 border border-border/50 rounded-xl p-3 items-end">
                <div><Label>Icon</Label><IconSelect value={it.icon} onChange={(v) => { const its = [...servicesInfo.items]; its[i] = { ...it, icon: v }; setServicesInfo({ ...servicesInfo, items: its }); }} /></div>
                <div><Label>Tiêu đề</Label><Input value={it.title} onChange={(e) => { const its = [...servicesInfo.items]; its[i] = { ...it, title: e.target.value }; setServicesInfo({ ...servicesInfo, items: its }); }} className="rounded-xl" /></div>
                <div><Label>Mô tả</Label><Input value={it.desc} onChange={(e) => { const its = [...servicesInfo.items]; its[i] = { ...it, desc: e.target.value }; setServicesInfo({ ...servicesInfo, items: its }); }} className="rounded-xl" /></div>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setServicesInfo({ ...servicesInfo, items: servicesInfo.items.filter((_, j) => j !== i) })}>
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </SectionCard>
        </TabsContent>

        {/* ─────────── Hình ảnh ─────────── */}
        <TabsContent value="gallery" className="space-y-6 mt-4">
          <SectionCard title="🖼️ Thư viện Hình ảnh" desc="Mỗi ô là một khung ảnh trên trang chủ. Một ô có thể chứa nhiều ảnh — khi đó ảnh tự đổi mỗi 2 giây.">
            <div><Label>Tiêu đề</Label><Input value={galleryInfo.title} onChange={(e) => setGalleryInfo({ ...galleryInfo, title: e.target.value })} className="rounded-xl" /></div>
            <Button size="sm" variant="outline" className="rounded-xl"
              onClick={() => setGalleryInfo({ ...galleryInfo, images: [...galleryInfo.images, { urls: [], caption: "" }] })}>
              <Plus size={14} /> Thêm ô hình
            </Button>
            {galleryInfo.images.map((g, i) => (
              <div key={i} className="space-y-3 rounded-2xl border border-border/50 p-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label>Chú thích ô hình #{i + 1}</Label>
                    <Input value={g.caption} onChange={(e) => { const n = [...galleryInfo.images]; n[i] = { ...g, caption: e.target.value }; setGalleryInfo({ ...galleryInfo, images: n }); }} className="rounded-xl" />
                  </div>
                  <Button size="icon" variant="ghost" className="text-destructive"
                    onClick={() => setGalleryInfo({ ...galleryInfo, images: galleryInfo.images.filter((_, j) => j !== i) })}>
                    <Trash2 size={16} />
                  </Button>
                </div>
                <ImageSlotEditor
                  label={`Ảnh của ô #${i + 1}`}
                  value={g.urls}
                  onChange={(urls) => { const n = [...galleryInfo.images]; n[i] = { ...g, urls }; setGalleryInfo({ ...galleryInfo, images: n }); }}
                />
              </div>
            ))}
          </SectionCard>
        </TabsContent>

        {/* ─────────── Tài liệu ─────────── */}
        <TabsContent value="documents" className="space-y-6 mt-4">
          <SectionCard title="📄 Tài liệu tải về" desc="Danh sách tài liệu học viên có thể tải (dán link file PDF hoặc Google Drive).">
            <div><Label>Tiêu đề</Label><Input value={documentsInfo.title} onChange={(e) => setDocumentsInfo({ ...documentsInfo, title: e.target.value })} className="rounded-xl" /></div>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setDocumentsInfo({ ...documentsInfo, items: [...documentsInfo.items, { title: "", desc: "", url: "" }] })}>
              <Plus size={14} /> Thêm tài liệu
            </Button>
            {documentsInfo.items.map((d, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 border border-border/50 rounded-xl p-3 items-end">
                <div><Label>Tiêu đề</Label><Input value={d.title} onChange={(e) => { const its = [...documentsInfo.items]; its[i] = { ...d, title: e.target.value }; setDocumentsInfo({ ...documentsInfo, items: its }); }} className="rounded-xl" /></div>
                <div><Label>Mô tả</Label><Input value={d.desc} onChange={(e) => { const its = [...documentsInfo.items]; its[i] = { ...d, desc: e.target.value }; setDocumentsInfo({ ...documentsInfo, items: its }); }} className="rounded-xl" /></div>
                <div><Label>Link tải</Label><Input value={d.url} onChange={(e) => { const its = [...documentsInfo.items]; its[i] = { ...d, url: e.target.value }; setDocumentsInfo({ ...documentsInfo, items: its }); }} className="rounded-xl" /></div>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDocumentsInfo({ ...documentsInfo, items: documentsInfo.items.filter((_, j) => j !== i) })}>
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </SectionCard>
        </TabsContent>

        {/* ─────────── Liên hệ ─────────── */}
        <TabsContent value="contact" className="space-y-6 mt-4">
          <SectionCard title="📞 Thông tin Liên hệ" desc="Hiển thị ở cuối trang chủ.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Tiêu đề</Label><Input value={contactInfo.title} onChange={(e) => setContactInfo({ ...contactInfo, title: e.target.value })} className="rounded-xl" /></div>
              <div><Label>Địa chỉ</Label><Input value={contactInfo.address} onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })} className="rounded-xl" /></div>
              <div><Label>Điện thoại</Label><Input value={contactInfo.phone} onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })} className="rounded-xl" /></div>
              <div><Label>Email</Label><Input value={contactInfo.email} onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })} className="rounded-xl" /></div>
              <div className="md:col-span-2"><Label>Giờ làm việc</Label><Input value={contactInfo.hours} onChange={(e) => setContactInfo({ ...contactInfo, hours: e.target.value })} className="rounded-xl" /></div>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-6 right-6 z-50">
        <Button variant="hero" size="lg" className="rounded-2xl shadow-2xl" onClick={saveAll} disabled={saving}>
          <Save size={20} /> {saving ? "Đang lưu..." : "Lưu tất cả"}
        </Button>
      </div>
    </div>
  );
}
