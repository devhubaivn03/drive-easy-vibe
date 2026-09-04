import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentRoleNav } from "@/hooks/useRoleNav";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout, NavItem } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Plus, Trash2, Globe, LayoutDashboard, GraduationCap, ClipboardList, MessageCircle, Pencil, Settings, Info, Wrench, Image as ImageIcon, FileText, Phone, Building2 } from "lucide-react";

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

interface AboutHighlight { icon: string; title: string; desc: string; }
interface AboutInfo { title: string; description: string; highlights: AboutHighlight[]; }
interface ServiceItem { icon: string; title: string; desc: string; }
interface ServicesInfo { title: string; items: ServiceItem[]; }
interface GalleryImage { url: string; caption: string; }
interface GalleryInfo { title: string; images: GalleryImage[]; }
interface DocumentItem { title: string; desc: string; url: string; }
interface DocumentsInfo { title: string; items: DocumentItem[]; }
interface ContactInfo { title: string; address: string; phone: string; email: string; hours: string; }
interface HeroSlide { caption: string; images: string[]; }
interface HeroGallery { title: string; slides: HeroSlide[]; }

const NAV_IDS: { id: string; hint: string }[] = [
  { id: "home", hint: "Trang chủ" },
  { id: "about", hint: "Giới thiệu" },
  { id: "courses", hint: "Khóa học" },
  { id: "services", hint: "Dịch vụ" },
  { id: "gallery", hint: "Hình ảnh" },
  { id: "documents", hint: "Tài liệu" },
  { id: "contact", hint: "Liên hệ" },
];

const SECTIONS = [
  { id: "sc-general", label: "1. Thông tin chung" },
  { id: "sc-nav", label: "2. Menu điều hướng" },
  { id: "sc-hero-gallery", label: "3. Ảnh Trang chủ" },
  { id: "sc-stats", label: "4. Thống kê" },
  { id: "sc-motorbike", label: "5. Khóa Xe máy" },
  { id: "sc-car", label: "6. Khóa Ô tô" },
  { id: "sc-about", label: "7. Giới thiệu" },
  { id: "sc-services", label: "8. Dịch vụ" },
  { id: "sc-gallery", label: "9. Thư viện ảnh" },
  { id: "sc-documents", label: "10. Tài liệu" },
  { id: "sc-contact", label: "11. Liên hệ" },
];

async function uploadSiteImage(file: File): Promise<string | null> {
  if (file.size > 10 * 1024 * 1024) { toast.error("Ảnh tối đa 10MB"); return null; }
  const ext = file.name.split(".").pop() || "jpg";
  const path = `site/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("question-images").upload(path, file, { contentType: file.type, upsert: true });
  if (error) { toast.error("Tải ảnh thất bại: " + error.message); return null; }
  return supabase.storage.from("question-images").getPublicUrl(path).data.publicUrl;
}

export default function SuperadminSiteContent() {
  const navItems = useCurrentRoleNav();
  const { profile } = useAuth();
  const isSuperadmin = profile?.role === "superadmin";
  return (
    <DashboardLayout navItems={navItems} roleLabel={isSuperadmin ? "SUPERADMIN" : "ADMIN"} roleColor="gradient-primary text-primary-foreground">
      <SiteContentEditor />
    </DashboardLayout>
  );
}

function SiteContentEditor() {
  const { profile } = useAuth();
  const isSuperadmin = profile?.role === "superadmin";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  // null = nội dung chung (mặc định cho toàn hệ thống)
  const [branchId, setBranchId] = useState<string | null>(null);
  const [branchReady, setBranchReady] = useState(false);

  // Content state
  const [brandName, setBrandName] = useState("DriveMaster");
  const [heroTitle1, setHeroTitle1] = useState("Dễ Dàng");
  const [heroTitle2, setHeroTitle2] = useState("Tự Tin");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [stats, setStats] = useState<StatItem[]>([]);
  const [motorbikeInfo, setMotorbikeInfo] = useState<CourseInfo>({ title: "", items: [] });
  const [carInfo, setCarInfo] = useState<CourseInfo>({ title: "", items: [] });
  const [aboutInfo, setAboutInfo] = useState<AboutInfo>({ title: "Về chúng tôi", description: "", highlights: [] });
  const [servicesInfo, setServicesInfo] = useState<ServicesInfo>({ title: "Dịch vụ", items: [] });
  const [galleryInfo, setGalleryInfo] = useState<GalleryInfo>({ title: "Hình ảnh", images: [] });
  const [documentsInfo, setDocumentsInfo] = useState<DocumentsInfo>({ title: "Tài liệu", items: [] });
  const [contactInfo, setContactInfo] = useState<ContactInfo>({ title: "Liên hệ", address: "", phone: "", email: "", hours: "" });
  const [navLabels, setNavLabels] = useState<Record<string, string>>({});
  const [coursesTitle, setCoursesTitle] = useState("Khóa học");
  const [footerNote, setFooterNote] = useState("All rights reserved.");
  const [heroGallery, setHeroGallery] = useState<HeroGallery>({
    title: "Hình ảnh trung tâm",
    slides: [
      { caption: "Sân tập rộng rãi", images: [] },
      { caption: "Xe tập đời mới", images: [] },
      { caption: "Học viên thực hành", images: [] },
      { caption: "Phòng học lý thuyết", images: [] },
      { caption: "Đội ngũ giáo viên", images: [] },
    ],
  });
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [homeLayout, setHomeLayout] = useState("1");

  useEffect(() => {
    if (!profile) return;
    if (isSuperadmin) {
      supabase.from("branches").select("id, name").order("created_at").then(({ data }) => {
        setBranches((data as any) || []);
        setBranchReady(true);
      });
    } else {
      setBranchId(profile.branch_id ?? null);
      setBranchReady(true);
    }
  }, [profile?.id, isSuperadmin]);

  useEffect(() => {
    if (!branchReady) return;
    const fetchContent = async () => {
      setLoading(true);
      const [globalRes, branchRes] = await Promise.all([
        supabase.from("site_content").select("key, value").is("branch_id", null),
        branchId
          ? supabase.from("site_content").select("key, value").eq("branch_id", branchId)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const rows = [...((globalRes.data as any[]) || []), ...(((branchRes as any).data as any[]) || [])];
      {
        const map: Record<string, any> = {};
        rows.forEach((r: any) => { map[r.key] = r.value; });
        if (map.brand_name) setBrandName(map.brand_name);
        if (map.hero_title_1) setHeroTitle1(map.hero_title_1);
        if (map.hero_title_2) setHeroTitle2(map.hero_title_2);
        if (map.hero_subtitle) setHeroSubtitle(map.hero_subtitle);
        if (map.stats) setStats(map.stats);
        if (map.motorbike_info) setMotorbikeInfo(map.motorbike_info);
        if (map.car_info) setCarInfo(map.car_info);
        if (map.about_info) setAboutInfo(map.about_info);
        if (map.services_info) setServicesInfo(map.services_info);
        if (map.gallery_info) setGalleryInfo(map.gallery_info);
        if (map.documents_info) setDocumentsInfo(map.documents_info);
        if (map.contact_info) setContactInfo(map.contact_info);
        if (map.nav_labels) setNavLabels(map.nav_labels);
        if (map.courses_title) setCoursesTitle(map.courses_title);
        if (map.footer_note) setFooterNote(map.footer_note);
        if (map.hero_gallery) setHeroGallery(map.hero_gallery);
        setHomeLayout(String(map.home_layout || "1"));
      }
      setLoading(false);
    };
    fetchContent();
  }, [branchReady, branchId]);

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
      { key: "about_info", value: aboutInfo },
      { key: "services_info", value: servicesInfo },
      { key: "gallery_info", value: galleryInfo },
      { key: "documents_info", value: documentsInfo },
      { key: "contact_info", value: contactInfo },
      { key: "nav_labels", value: navLabels },
      { key: "courses_title", value: coursesTitle },
      { key: "footer_note", value: footerNote },
      { key: "hero_gallery", value: heroGallery },
      { key: "home_layout", value: homeLayout },
    ];

    let hasError = false;
    for (const entry of entries) {
      const existingQuery = supabase.from("site_content").select("id").eq("key", entry.key);
      const { data: existing } = branchId
        ? await existingQuery.eq("branch_id", branchId).maybeSingle()
        : await existingQuery.is("branch_id", null).maybeSingle();
      const { error } = existing
        ? await supabase
            .from("site_content")
            .update({ value: entry.value, updated_at: new Date().toISOString() })
            .eq("id", (existing as any).id)
        : await supabase
            .from("site_content")
            .insert({ key: entry.key, value: entry.value, branch_id: branchId, updated_at: new Date().toISOString() } as any);
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

  const iconOptions = ["Users", "GraduationCap", "Clock", "Award", "Bike", "Car", "Star", "Heart", "Wrench", "FileText", "ImageIcon", "Info", "BookOpen", "Phone", "Mail", "MapPin", "Download"];

  if (loading) {
    return <div className="p-6 text-muted-foreground">Đang tải...</div>;
  }

  const updateSlot = (i: number, patch: Partial<HeroSlide>) => {
    const slides = [...heroGallery.slides];
    slides[i] = { ...slides[i], ...patch };
    setHeroGallery({ ...heroGallery, slides });
  };

  const onUploadSlot = async (i: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingSlot(i);
    const urls: string[] = [];
    for (const f of Array.from(files)) {
      const url = await uploadSiteImage(f);
      if (url) urls.push(url);
    }
    setUploadingSlot(null);
    if (urls.length) {
      updateSlot(i, { images: [...(heroGallery.slides[i].images || []), ...urls] });
      toast.success(`Đã thêm ${urls.length} ảnh`);
    }
  };

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

      {/* Branch switcher */}
      <div className="glass-card rounded-2xl p-4">
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Building2 size={14} /> Chi nhánh đang chỉnh sửa
        </p>
        {isSuperadmin ? (
          <>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setBranchId(null)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${branchId === null ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
              >
                Nội dung chung (mặc định)
              </button>
              {branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBranchId(b.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${branchId === b.id ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
                >
                  {b.name}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              "Nội dung chung" áp dụng cho toàn hệ thống. Khi chọn một chi nhánh, nội dung bạn lưu chỉ dành riêng cho chi nhánh đó (phần chưa sửa sẽ dùng nội dung chung).
            </p>
          </>
        ) : (
          <p className="text-sm text-foreground">
            Bạn đang chỉnh sửa nội dung của chi nhánh mình. Các phần chưa sửa sẽ dùng nội dung chung của hệ thống.
          </p>
        )}
      </div>

      {/* Quick nav */}
      <div className="glass-card rounded-2xl p-4">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">Đi nhanh tới phần cần sửa</p>
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="rounded-full border border-border/60 px-3 py-1 text-xs font-medium hover:border-primary/60 hover:bg-primary/10 transition"
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Mọi thay đổi chỉ hiển thị trên trang chủ sau khi nhấn <strong>Lưu tất cả</strong>.
        </p>
      </div>

      {/* Chọn kiểu bố cục trang chủ */}
      <section id="sc-layout" className="glass-card rounded-2xl p-6 space-y-4 scroll-mt-24">
        <h2 className="text-lg font-semibold text-foreground">0. 🎨 Kiểu bố cục trang chủ</h2>
        <p className="text-xs text-muted-foreground">Chọn cách trình bày phần đầu trang chủ. Nội dung bên dưới dùng chung cho cả hai kiểu.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: "1", name: "Bố cục 1 — Ảnh nền lớn", desc: "Tiêu đề nổi trên nền ảnh chia 4 khung, kèm 2 thẻ khóa học và dãy con số." },
            { id: "2", name: "Bố cục 2 — Dạng bảng điều khiển", desc: "Tiêu đề ở giữa, các thẻ khóa học / con số / hình ảnh xếp gọn hai bên." },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setHomeLayout(opt.id)}
              className={`rounded-2xl border p-4 text-left transition ${homeLayout === opt.id ? "border-primary bg-primary/10 shadow-lg" : "border-border/60 hover:border-primary/50"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-foreground">{opt.name}</span>
                {homeLayout === opt.id && <span className="rounded-full gradient-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">Đang dùng</span>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{opt.desc}</p>
              {opt.id === "1" ? (
                <div className="mt-3 grid grid-cols-2 grid-rows-3 gap-1.5">
                  <div className="row-span-2 rounded-lg bg-muted h-full min-h-8" />
                  <div className="row-span-3 rounded-lg bg-muted min-h-8" />
                  <div className="rounded-lg bg-primary/30 min-h-4" />
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  <div className="space-y-1.5">
                    <div className="h-6 rounded-lg bg-muted" />
                    <div className="h-6 rounded-lg bg-muted" />
                  </div>
                  <div className="rounded-lg bg-primary/30" />
                  <div className="space-y-1.5">
                    <div className="h-6 rounded-lg bg-muted" />
                    <div className="h-6 rounded-lg bg-muted" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Brand & Hero */}
      <section id="sc-general" className="glass-card rounded-2xl p-6 space-y-4 scroll-mt-24">
        <h2 className="text-lg font-semibold text-foreground">1. 🏠 Thông tin chung</h2>
        <p className="text-xs text-muted-foreground">Tên thương hiệu và dòng tiêu đề lớn nhất ở đầu trang chủ.</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Tiêu đề mục Khóa học</Label>
            <Input value={coursesTitle} onChange={(e) => setCoursesTitle(e.target.value)} className="rounded-xl" />
          </div>
          <div>
            <Label>Dòng chân trang (footer)</Label>
            <Input value={footerNote} onChange={(e) => setFooterNote(e.target.value)} className="rounded-xl" />
          </div>
        </div>
      </section>

      {/* Navbar labels */}
      <section id="sc-nav" className="glass-card rounded-2xl p-6 space-y-4 scroll-mt-24">
        <h2 className="text-lg font-semibold text-foreground">2. 🧭 Menu điều hướng</h2>
        <p className="text-xs text-muted-foreground">
          Đổi tên các mục trên thanh menu trang chủ. Để trống sẽ dùng lại tên mặc định.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {NAV_IDS.map((n) => (
            <div key={n.id}>
              <Label>{n.hint}</Label>
              <Input
                value={navLabels[n.id] ?? ""}
                placeholder={n.hint}
                onChange={(e) => setNavLabels({ ...navLabels, [n.id]: e.target.value })}
                className="rounded-xl"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Hero gallery */}
      <section id="sc-hero-gallery" className="glass-card rounded-2xl p-6 space-y-4 scroll-mt-24">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">3. 🖼️ Ảnh Trang chủ (khối ảnh lớn)</h2>
          <Button size="sm" variant="outline" className="rounded-xl"
            onClick={() => setHeroGallery({ ...heroGallery, slides: [...heroGallery.slides, { caption: "", images: [] }] })}>
            <Plus size={14} /> Thêm ô ảnh
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Mỗi <strong>ô ảnh</strong> là một khung trên trang chủ. Nếu một ô có <strong>2 ảnh trở lên</strong>, các ảnh sẽ tự động
          đổi sau mỗi <strong>2 giây</strong>. Chỉ 5 ô đầu tiên được hiển thị.
          <br />
          <strong>4 ô đầu tiên</strong> còn được dùng làm <strong>ảnh nền mờ của Hero trang chủ</strong>
          (nằm trên nền chấm bi, phía dưới chữ và các thẻ thông tin).
        </p>
        <div>
          <Label>Tiêu đề khối ảnh</Label>
          <Input value={heroGallery.title} onChange={(e) => setHeroGallery({ ...heroGallery, title: e.target.value })} className="rounded-xl" />
        </div>
        {heroGallery.slides.map((s, i) => (
          <div key={i} className="rounded-xl border border-border/50 p-4 space-y-3">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label>Ô ảnh #{i + 1} — chú thích</Label>
                <Input value={s.caption} onChange={(e) => updateSlot(i, { caption: e.target.value })} className="rounded-xl" />
              </div>
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-xs font-medium hover:bg-primary/10">
                  <ImageIcon size={14} /> {uploadingSlot === i ? "Đang tải..." : "Tải ảnh lên"}
                </span>
                <input type="file" accept="image/*" multiple hidden onChange={(e) => { onUploadSlot(i, e.target.files); e.currentTarget.value = ""; }} />
              </label>
              <Button size="icon" variant="ghost" className="text-destructive"
                onClick={() => setHeroGallery({ ...heroGallery, slides: heroGallery.slides.filter((_, j) => j !== i) })}>
                <Trash2 size={16} />
              </Button>
            </div>

            <div className="flex flex-wrap gap-3">
              {(s.images || []).map((url, k) => (
                <div key={k} className="relative h-20 w-28 overflow-hidden rounded-lg border border-border/50">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => updateSlot(i, { images: s.images.filter((_, j) => j !== k) })}
                    className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground"
                    title="Xóa ảnh"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {(s.images || []).length === 0 && (
                <p className="text-xs text-muted-foreground">Chưa có ảnh — tải lên hoặc dán link bên dưới.</p>
              )}
            </div>

            <div>
              <Label className="text-xs">Hoặc dán link ảnh (mỗi dòng 1 link)</Label>
              <Textarea
                rows={2}
                value={(s.images || []).join("\n")}
                onChange={(e) => updateSlot(i, { images: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })}
                className="rounded-xl font-mono text-xs"
              />
            </div>
            {(s.images || []).length > 1 && (
              <p className="text-xs text-primary">✓ {s.images.length} ảnh — sẽ tự động đổi mỗi 2 giây</p>
            )}
          </div>
        ))}
      </section>

      {/* Stats */}
      <section id="sc-stats" className="glass-card rounded-2xl p-6 space-y-4 scroll-mt-24">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">4. 📊 Thống kê nổi bật</h2>
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
      <section id="sc-motorbike" className="glass-card rounded-2xl p-6 space-y-4 scroll-mt-24">
        <h2 className="text-lg font-semibold text-foreground">5. 🏍️ Khóa học Xe máy</h2>
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
      <section id="sc-car" className="glass-card rounded-2xl p-6 space-y-4 scroll-mt-24">
        <h2 className="text-lg font-semibold text-foreground">6. 🚗 Khóa học Ô tô</h2>
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

      {/* About */}
      <section id="sc-about" className="glass-card rounded-2xl p-6 space-y-4 scroll-mt-24">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Info size={18} /> 7. Giới thiệu</h2>
        <div><Label>Tiêu đề</Label><Input value={aboutInfo.title} onChange={(e) => setAboutInfo({ ...aboutInfo, title: e.target.value })} className="rounded-xl" /></div>
        <div><Label>Mô tả</Label><Textarea value={aboutInfo.description} onChange={(e) => setAboutInfo({ ...aboutInfo, description: e.target.value })} rows={3} className="rounded-xl" /></div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Điểm nổi bật</span>
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setAboutInfo({ ...aboutInfo, highlights: [...aboutInfo.highlights, { icon: "Award", title: "", desc: "" }] })}>
            <Plus size={14} /> Thêm
          </Button>
        </div>
        {aboutInfo.highlights.map((h, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 border border-border/50 rounded-xl p-3 items-end">
            <div>
              <Label>Icon</Label>
              <select value={h.icon} onChange={(e) => { const n = { ...aboutInfo, highlights: [...aboutInfo.highlights] }; n.highlights[i] = { ...h, icon: e.target.value }; setAboutInfo(n); }} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
                {iconOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div><Label>Tiêu đề</Label><Input value={h.title} onChange={(e) => { const n = { ...aboutInfo, highlights: [...aboutInfo.highlights] }; n.highlights[i] = { ...h, title: e.target.value }; setAboutInfo(n); }} className="rounded-xl" /></div>
            <div><Label>Mô tả</Label><Input value={h.desc} onChange={(e) => { const n = { ...aboutInfo, highlights: [...aboutInfo.highlights] }; n.highlights[i] = { ...h, desc: e.target.value }; setAboutInfo(n); }} className="rounded-xl" /></div>
            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setAboutInfo({ ...aboutInfo, highlights: aboutInfo.highlights.filter((_, j) => j !== i) })}>
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </section>

      {/* Services */}
      <section id="sc-services" className="glass-card rounded-2xl p-6 space-y-4 scroll-mt-24">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Wrench size={18} /> 8. Dịch vụ</h2>
        <div><Label>Tiêu đề</Label><Input value={servicesInfo.title} onChange={(e) => setServicesInfo({ ...servicesInfo, title: e.target.value })} className="rounded-xl" /></div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Danh sách dịch vụ</span>
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setServicesInfo({ ...servicesInfo, items: [...servicesInfo.items, { icon: "Wrench", title: "", desc: "" }] })}>
            <Plus size={14} /> Thêm
          </Button>
        </div>
        {servicesInfo.items.map((it, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 border border-border/50 rounded-xl p-3 items-end">
            <div>
              <Label>Icon</Label>
              <select value={it.icon} onChange={(e) => { const n = { ...servicesInfo, items: [...servicesInfo.items] }; n.items[i] = { ...it, icon: e.target.value }; setServicesInfo(n); }} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
                {iconOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div><Label>Tiêu đề</Label><Input value={it.title} onChange={(e) => { const n = { ...servicesInfo, items: [...servicesInfo.items] }; n.items[i] = { ...it, title: e.target.value }; setServicesInfo(n); }} className="rounded-xl" /></div>
            <div><Label>Mô tả</Label><Input value={it.desc} onChange={(e) => { const n = { ...servicesInfo, items: [...servicesInfo.items] }; n.items[i] = { ...it, desc: e.target.value }; setServicesInfo(n); }} className="rounded-xl" /></div>
            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setServicesInfo({ ...servicesInfo, items: servicesInfo.items.filter((_, j) => j !== i) })}>
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </section>

      {/* Gallery */}
      <section id="sc-gallery" className="glass-card rounded-2xl p-6 space-y-4 scroll-mt-24">
        <h2 className="text-lg font-semibold flex items-center gap-2"><ImageIcon size={18} /> 9. Thư viện ảnh (mục "Hình ảnh")</h2>
        <div><Label>Tiêu đề</Label><Input value={galleryInfo.title} onChange={(e) => setGalleryInfo({ ...galleryInfo, title: e.target.value })} className="rounded-xl" /></div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Hình ảnh (URL)</span>
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setGalleryInfo({ ...galleryInfo, images: [...galleryInfo.images, { url: "", caption: "" }] })}>
            <Plus size={14} /> Thêm
          </Button>
        </div>
        {galleryInfo.images.map((g, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3 border border-border/50 rounded-xl p-3 items-end">
            <div className="md:col-span-2"><Label>URL ảnh</Label><Input value={g.url} onChange={(e) => { const n = { ...galleryInfo, images: [...galleryInfo.images] }; n.images[i] = { ...g, url: e.target.value }; setGalleryInfo(n); }} className="rounded-xl" /></div>
            <div className="flex gap-2 items-end">
              <div className="flex-1"><Label>Chú thích</Label><Input value={g.caption} onChange={(e) => { const n = { ...galleryInfo, images: [...galleryInfo.images] }; n.images[i] = { ...g, caption: e.target.value }; setGalleryInfo(n); }} className="rounded-xl" /></div>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setGalleryInfo({ ...galleryInfo, images: galleryInfo.images.filter((_, j) => j !== i) })}>
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ))}
      </section>

      {/* Documents */}
      <section id="sc-documents" className="glass-card rounded-2xl p-6 space-y-4 scroll-mt-24">
        <h2 className="text-lg font-semibold flex items-center gap-2"><FileText size={18} /> 10. Tài liệu</h2>
        <div><Label>Tiêu đề</Label><Input value={documentsInfo.title} onChange={(e) => setDocumentsInfo({ ...documentsInfo, title: e.target.value })} className="rounded-xl" /></div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Danh sách tài liệu</span>
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setDocumentsInfo({ ...documentsInfo, items: [...documentsInfo.items, { title: "", desc: "", url: "" }] })}>
            <Plus size={14} /> Thêm
          </Button>
        </div>
        {documentsInfo.items.map((d, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 border border-border/50 rounded-xl p-3 items-end">
            <div><Label>Tiêu đề</Label><Input value={d.title} onChange={(e) => { const n = { ...documentsInfo, items: [...documentsInfo.items] }; n.items[i] = { ...d, title: e.target.value }; setDocumentsInfo(n); }} className="rounded-xl" /></div>
            <div><Label>Mô tả</Label><Input value={d.desc} onChange={(e) => { const n = { ...documentsInfo, items: [...documentsInfo.items] }; n.items[i] = { ...d, desc: e.target.value }; setDocumentsInfo(n); }} className="rounded-xl" /></div>
            <div><Label>URL</Label><Input value={d.url} onChange={(e) => { const n = { ...documentsInfo, items: [...documentsInfo.items] }; n.items[i] = { ...d, url: e.target.value }; setDocumentsInfo(n); }} className="rounded-xl" /></div>
            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDocumentsInfo({ ...documentsInfo, items: documentsInfo.items.filter((_, j) => j !== i) })}>
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </section>

      {/* Contact */}
      <section id="sc-contact" className="glass-card rounded-2xl p-6 space-y-4 scroll-mt-24">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Phone size={18} /> 11. Liên hệ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Tiêu đề</Label><Input value={contactInfo.title} onChange={(e) => setContactInfo({ ...contactInfo, title: e.target.value })} className="rounded-xl" /></div>
          <div><Label>Địa chỉ</Label><Input value={contactInfo.address} onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })} className="rounded-xl" /></div>
          <div><Label>Điện thoại</Label><Input value={contactInfo.phone} onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })} className="rounded-xl" /></div>
          <div><Label>Email</Label><Input value={contactInfo.email} onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })} className="rounded-xl" /></div>
          <div className="md:col-span-2"><Label>Giờ làm việc</Label><Input value={contactInfo.hours} onChange={(e) => setContactInfo({ ...contactInfo, hours: e.target.value })} className="rounded-xl" /></div>
        </div>
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
