import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ContactWidget } from "@/components/landing/ContactWidget";
import { ChatWidget } from "@/components/landing/ChatWidget";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Bike, Car, LogIn, GraduationCap, Clock, Award, Users, Star, Heart,
  Menu, X, Phone, Mail, MapPin, FileText, Image as ImageIcon, Wrench, Info, Home, BookOpen, Download
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const iconMap: Record<string, any> = {
  Users, GraduationCap, Clock, Award, Bike, Car, Star, Heart,
  Wrench, FileText, ImageIcon, Info, BookOpen, Phone, Mail, MapPin, Download,
};

const NAV_LINKS = [
  { id: "home", label: "Trang chủ", icon: Home },
  { id: "about", label: "Giới thiệu", icon: Info },
  { id: "courses", label: "Khóa học", icon: BookOpen },
  { id: "services", label: "Dịch vụ", icon: Wrench },
  { id: "gallery", label: "Hình ảnh", icon: ImageIcon },
  { id: "documents", label: "Tài liệu", icon: FileText },
  { id: "contact", label: "Liên hệ", icon: Phone },
];

export default function LandingPage() {
  const [motorbikeOpen, setMotorbikeOpen] = useState(false);
  const [carOpen, setCarOpen] = useState(false);
  const [content, setContent] = useState<Record<string, any> | null>(null);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    supabase.from("site_content").select("key, value").then(({ data }) => {
      if (data) {
        const map: Record<string, any> = {};
        data.forEach((r: any) => { map[r.key] = r.value; });
        setContent(map);
      }
    });
  }, []);

  const brandName = content?.brand_name || "DriveMaster";
  const heroTitle1 = content?.hero_title_1 || "Dễ Dàng";
  const heroTitle2 = content?.hero_title_2 || "Tự Tin";
  const heroSubtitle = content?.hero_subtitle || "Trung tâm đào tạo lái xe uy tín hàng đầu Việt Nam. Cam kết đậu 100% với phương pháp giảng dạy hiện đại.";
  const stats = content?.stats || [
    { icon: "Users", value: "10,000+", label: "Học viên" },
    { icon: "GraduationCap", value: "98%", label: "Tỷ lệ đậu" },
    { icon: "Clock", value: "10+", label: "Năm kinh nghiệm" },
    { icon: "Award", value: "50+", label: "Giáo viên" },
  ];
  const motorbikeInfo = content?.motorbike_info || {
    title: "Bằng lái Xe Máy",
    items: [
      { type: "A1", desc: "Xe máy dưới 175cc", duration: "1–2 tháng", fee: "500.000đ" },
      { type: "A2", desc: "Xe máy trên 175cc", duration: "2–3 tháng", fee: "800.000đ" },
    ],
  };
  const carInfo = content?.car_info || {
    title: "Bằng lái Ô Tô",
    items: [
      { type: "B1", desc: "Ô tô dưới 9 chỗ (không hành nghề)", duration: "3–4 tháng", fee: "6.000.000đ" },
      { type: "B2", desc: "Ô tô dưới 9 chỗ (hành nghề)", duration: "4–6 tháng", fee: "8.000.000đ" },
      { type: "C", desc: "Xe tải trên 3.5 tấn", duration: "6–8 tháng", fee: "10.000.000đ" },
    ],
  };
  const aboutInfo = content?.about_info || {
    title: "Về chúng tôi",
    description: "Hơn 10 năm kinh nghiệm đào tạo lái xe an toàn, chuyên nghiệp. Đội ngũ giáo viên giàu kinh nghiệm, sân tập hiện đại, cam kết đậu 100%.",
    highlights: [
      { icon: "Award", title: "Chất lượng hàng đầu", desc: "Đạt chuẩn Bộ GTVT, sân tập hiện đại" },
      { icon: "Users", title: "Đội ngũ chuyên nghiệp", desc: "50+ giáo viên giàu kinh nghiệm" },
      { icon: "GraduationCap", title: "Cam kết đậu", desc: "Tỷ lệ đậu 98% qua các kỳ thi" },
    ],
  };
  const servicesInfo = content?.services_info || {
    title: "Dịch vụ",
    items: [
      { icon: "BookOpen", title: "Học lý thuyết online", desc: "Học mọi lúc, mọi nơi qua hệ thống số" },
      { icon: "Car", title: "Thực hành sa hình", desc: "Sân tập hiện đại, xe đời mới" },
      { icon: "Award", title: "Thi sát hạch", desc: "Hỗ trợ trọn gói, đảm bảo kết quả" },
      { icon: "Wrench", title: "Bảo dưỡng kỹ năng", desc: "Khóa nâng cao sau khi có bằng" },
    ],
  };
  const galleryInfo = content?.gallery_info || {
    title: "Hình ảnh",
    images: [
      { url: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800", caption: "Sân tập rộng rãi" },
      { url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800", caption: "Xe tập đời mới" },
      { url: "https://images.unsplash.com/photo-1517512006864-7edc3b933137?w=800", caption: "Học viên thực hành" },
    ],
  };
  const documentsInfo = content?.documents_info || {
    title: "Tài liệu",
    items: [
      { title: "Bộ 600 câu lý thuyết", desc: "PDF tổng hợp đầy đủ", url: "#" },
      { title: "Mẹo thi sa hình", desc: "Hướng dẫn từng bài thi", url: "#" },
    ],
  };
  const contactInfo = content?.contact_info || {
    title: "Liên hệ",
    address: "123 Đường ABC, Quận 1, TP.HCM",
    phone: "0900 000 000",
    email: "info@drivemaster.vn",
    hours: "T2 - CN: 7:00 - 21:00",
  };

  const scrollTo = (id: string) => {
    setMobileNav(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Navbar */}
      <nav className="fixed top-0 z-40 w-full glass-card border-b border-border/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <button onClick={() => scrollTo("home")} className="text-xl font-extrabold gradient-text">🚗 {brandName}</button>
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <button
                key={l.id}
                onClick={() => scrollTo(l.id)}
                className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary rounded-lg hover:bg-primary/10 transition"
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" className="hidden sm:block">
              <Button variant="hero" size="sm" className="rounded-xl">
                <LogIn size={16} />
                Đăng nhập
              </Button>
            </Link>
            <button className="lg:hidden p-2" onClick={() => setMobileNav(!mobileNav)} aria-label="Menu">
              {mobileNav ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {mobileNav && (
          <div className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur">
            <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => scrollTo(l.id)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary rounded-lg hover:bg-primary/10 transition text-left"
                >
                  <l.icon size={16} /> {l.label}
                </button>
              ))}
              <Link to="/login" className="sm:hidden">
                <Button variant="hero" size="sm" className="rounded-xl w-full mt-2">
                  <LogIn size={16} /> Đăng nhập
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="home" className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-16 overflow-hidden">
        <div className="absolute -top-20 left-1/4 h-96 w-96 rounded-full gradient-primary opacity-20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full gradient-secondary opacity-20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full gradient-accent opacity-15 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 text-center"
        >
          <h1 className="mb-4 text-4xl font-extrabold leading-tight md:text-6xl lg:text-7xl">
            Học Lái Xe — <span className="gradient-text">{heroTitle1}</span> & <span className="gradient-text-accent">{heroTitle2}</span>
          </h1>
          <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground">{heroSubtitle}</p>
        </motion.div>

        <div className="relative z-10 flex flex-col gap-8 md:flex-row">
          <motion.div
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            whileHover={{ scale: 1.05 }} onClick={() => setMotorbikeOpen(true)}
            className="group cursor-pointer glass-card rounded-3xl p-8 w-72 text-center transition-all duration-500 hover:shadow-2xl"
          >
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary">
              <Bike className="h-10 w-10 text-primary-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">🏍️ Xe Máy</h3>
            <p className="text-sm text-muted-foreground">{motorbikeInfo.items.map((i: any) => i.type).join(", ")} — Nhanh chóng, tiện lợi</p>
            <div className="mt-4 text-xs font-semibold text-primary">Nhấn để xem chi tiết →</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
            whileHover={{ scale: 1.05 }} onClick={() => setCarOpen(true)}
            className="group cursor-pointer glass-card rounded-3xl p-8 w-72 text-center transition-all duration-500 hover:shadow-2xl"
          >
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl gradient-secondary">
              <Car className="h-10 w-10 text-secondary-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">🚗 Ô Tô</h3>
            <p className="text-sm text-muted-foreground">{carInfo.items.map((i: any) => i.type).join(", ")} — Chuyên nghiệp, bài bản</p>
            <div className="mt-4 text-xs font-semibold text-secondary">Nhấn để xem chi tiết →</div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }}
          className="relative z-10 mt-20 grid grid-cols-2 gap-6 md:grid-cols-4"
        >
          {stats.map((stat: any, i: number) => {
            const Icon = iconMap[stat.icon] || Users;
            return (
              <div key={i} className="glass-card rounded-2xl p-6 text-center">
                <Icon className="mx-auto mb-2 h-8 w-8 text-primary" />
                <div className="text-2xl font-extrabold gradient-text">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            );
          })}
        </motion.div>
      </section>

      {/* About */}
      <section id="about" className="relative py-20 px-4 scroll-mt-16">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4 gradient-text">{aboutInfo.title}</h2>
          <p className="text-center text-muted-foreground max-w-3xl mx-auto mb-12">{aboutInfo.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aboutInfo.highlights?.map((h: any, i: number) => {
              const Icon = iconMap[h.icon] || Star;
              return (
                <div key={i} className="glass-card rounded-2xl p-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary">
                    <Icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{h.title}</h3>
                  <p className="text-sm text-muted-foreground">{h.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Courses */}
      <section id="courses" className="relative py-20 px-4 bg-muted/30 scroll-mt-16">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12 gradient-text">Khóa học</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
                  <Bike className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">{motorbikeInfo.title}</h3>
              </div>
              <div className="space-y-3">
                {motorbikeInfo.items.map((it: any) => (
                  <div key={it.type} className="rounded-xl border border-border/50 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">Hạng {it.type}</span>
                      <span className="gradient-primary rounded-full px-3 py-1 text-xs font-semibold text-primary-foreground">{it.fee}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{it.desc}</p>
                    <p className="text-xs text-muted-foreground">⏱ {it.duration}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-secondary">
                  <Car className="h-6 w-6 text-secondary-foreground" />
                </div>
                <h3 className="text-xl font-bold">{carInfo.title}</h3>
              </div>
              <div className="space-y-3">
                {carInfo.items.map((it: any) => (
                  <div key={it.type} className="rounded-xl border border-border/50 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">Hạng {it.type}</span>
                      <span className="gradient-secondary rounded-full px-3 py-1 text-xs font-semibold text-secondary-foreground">{it.fee}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{it.desc}</p>
                    <p className="text-xs text-muted-foreground">⏱ {it.duration}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="relative py-20 px-4 scroll-mt-16">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12 gradient-text">{servicesInfo.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {servicesInfo.items?.map((s: any, i: number) => {
              const Icon = iconMap[s.icon] || Wrench;
              return (
                <div key={i} className="glass-card rounded-2xl p-6 text-center hover:shadow-xl transition">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl gradient-accent">
                    <Icon className="h-7 w-7 text-accent-foreground" />
                  </div>
                  <h3 className="font-bold mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="relative py-20 px-4 bg-muted/30 scroll-mt-16">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12 gradient-text">{galleryInfo.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryInfo.images?.map((g: any, i: number) => (
              <div key={i} className="group relative overflow-hidden rounded-2xl glass-card">
                <img src={g.url} alt={g.caption} loading="lazy" className="w-full h-64 object-cover transition group-hover:scale-105" />
                {g.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white text-sm font-medium">
                    {g.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Documents */}
      <section id="documents" className="relative py-20 px-4 scroll-mt-16">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12 gradient-text">{documentsInfo.title}</h2>
          <div className="space-y-4">
            {documentsInfo.items?.map((d: any, i: number) => (
              <a
                key={i} href={d.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 glass-card rounded-2xl p-5 hover:shadow-xl transition"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-primary">
                  <FileText className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{d.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{d.desc}</p>
                </div>
                <Download className="h-5 w-5 text-primary shrink-0" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="relative py-20 px-4 bg-muted/30 scroll-mt-16">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12 gradient-text">{contactInfo.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-6 flex items-start gap-3">
              <MapPin className="h-6 w-6 text-primary shrink-0 mt-1" />
              <div><div className="font-bold mb-1">Địa chỉ</div><div className="text-sm text-muted-foreground">{contactInfo.address}</div></div>
            </div>
            <div className="glass-card rounded-2xl p-6 flex items-start gap-3">
              <Phone className="h-6 w-6 text-primary shrink-0 mt-1" />
              <div><div className="font-bold mb-1">Điện thoại</div><a href={`tel:${contactInfo.phone}`} className="text-sm text-muted-foreground hover:text-primary">{contactInfo.phone}</a></div>
            </div>
            <div className="glass-card rounded-2xl p-6 flex items-start gap-3">
              <Mail className="h-6 w-6 text-primary shrink-0 mt-1" />
              <div><div className="font-bold mb-1">Email</div><a href={`mailto:${contactInfo.email}`} className="text-sm text-muted-foreground hover:text-primary">{contactInfo.email}</a></div>
            </div>
            <div className="glass-card rounded-2xl p-6 flex items-start gap-3">
              <Clock className="h-6 w-6 text-primary shrink-0 mt-1" />
              <div><div className="font-bold mb-1">Giờ làm việc</div><div className="text-sm text-muted-foreground">{contactInfo.hours}</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {brandName}. All rights reserved.
      </footer>

      {/* Motorbike Dialog */}
      <Dialog open={motorbikeOpen} onOpenChange={setMotorbikeOpen}>
        <DialogContent className="glass-card border-border/50 sm:max-w-md">
          <DialogHeader><DialogTitle className="text-xl font-bold gradient-text">🏍️ {motorbikeInfo.title}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {motorbikeInfo.items.map((item: any) => (
              <div key={item.type} className="rounded-xl border border-border/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg">Hạng {item.type}</span>
                  <span className="gradient-primary rounded-full px-3 py-1 text-xs font-semibold text-primary-foreground">{item.fee}</span>
                </div>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
                <p className="text-sm text-muted-foreground">⏱ {item.duration}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Car Dialog */}
      <Dialog open={carOpen} onOpenChange={setCarOpen}>
        <DialogContent className="glass-card border-border/50 sm:max-w-md">
          <DialogHeader><DialogTitle className="text-xl font-bold gradient-text">🚗 {carInfo.title}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {carInfo.items.map((item: any) => (
              <div key={item.type} className="rounded-xl border border-border/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg">Hạng {item.type}</span>
                  <span className="gradient-secondary rounded-full px-3 py-1 text-xs font-semibold text-secondary-foreground">{item.fee}</span>
                </div>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
                <p className="text-sm text-muted-foreground">⏱ {item.duration}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <ContactWidget />
      <ChatWidget />
    </div>
  );
}
