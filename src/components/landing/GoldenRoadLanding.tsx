import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Award, Bike, BookOpen, Car, Clock, Download, FileText, GraduationCap,
  Heart, Image as ImageIcon, Info, LogIn, Mail, MapPin, Menu, Phone,
  Star, Users, Wrench, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RotatingImage } from "@/components/landing/RotatingImage";
import { ContactWidget } from "@/components/landing/ContactWidget";
import { ChatWidget } from "@/components/landing/ChatWidget";

const iconMap: Record<string, any> = {
  Users, GraduationCap, Clock, Award, Bike, Car, Star, Heart,
  Wrench, FileText, ImageIcon, Info, BookOpen, Phone, Mail, MapPin, Download,
};

interface GoldenRoadLandingProps {
  brandName: string;
  heroTitle1: string;
  heroTitle2: string;
  heroSubtitle: string;
  stats: any[];
  motorbikeInfo: any;
  carInfo: any;
  aboutInfo: any;
  servicesInfo: any;
  galleryInfo: any;
  documentsInfo: any;
  contactInfo: any;
  navLinks: any[];
  coursesTitle: string;
  heroGallery: any;
  heroSlides: any[];
  footerNote: string;
}

export function GoldenRoadLanding(props: GoldenRoadLandingProps) {
  const {
    brandName, heroTitle1, heroTitle2, heroSubtitle, stats, motorbikeInfo, carInfo,
    aboutInfo, servicesInfo, galleryInfo, documentsInfo, contactInfo, navLinks,
    coursesTitle, heroGallery, heroSlides, footerNote,
  } = props;
  const [mobileNav, setMobileNav] = useState(false);
  const [motorbikeOpen, setMotorbikeOpen] = useState(false);
  const [carOpen, setCarOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMobileNav(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const reveal = {
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: 0.5 },
  };

  return (
    <div className="landing-theme-2 min-h-screen bg-background text-foreground">
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <Button variant="ghost" onClick={() => scrollTo("home")} className="h-auto px-0 hover:bg-transparent">
            <Car className="text-primary" />
            <span className="text-lg font-extrabold">{brandName}</span>
          </Button>
          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Button key={link.id} variant="ghost" size="sm" onClick={() => scrollTo(link.id)} className="text-xs">
                {link.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm" className="rounded-full px-5">
              <Link to="/login"><LogIn /> Đăng nhập</Link>
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNav(!mobileNav)} aria-label="Mở menu">
              {mobileNav ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        {mobileNav && (
          <div className="border-t border-border bg-background px-4 py-3 lg:hidden">
            {navLinks.map((link) => (
              <Button key={link.id} variant="ghost" onClick={() => scrollTo(link.id)} className="w-full justify-start">
                <link.icon /> {link.label}
              </Button>
            ))}
          </div>
        )}
      </nav>

      <main>
        <section id="home" className="mx-auto grid min-h-[78vh] max-w-7xl items-center gap-10 px-5 pb-16 pt-28 md:grid-cols-[0.95fr_1.05fr] md:px-8">
          <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <p className="mb-4 text-xs font-bold uppercase text-primary">Hệ thống đào tạo lái xe</p>
            <h1 className="max-w-xl text-5xl font-extrabold leading-[1.04] md:text-7xl">
              {heroTitle1}.<br /><span className="text-primary">{heroTitle2}.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">{heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => scrollTo("courses")} className="rounded-md">Xem khóa học →</Button>
              <Button variant="outline" onClick={() => scrollTo("about")} className="rounded-md">Khám phá {brandName}</Button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="golden-hero-media relative min-h-[310px] overflow-hidden rounded-lg border border-border md:min-h-[430px]">
            <RotatingImage images={heroSlides[0]?.images || []} delayMs={0} showDots={false} className="absolute inset-0 rounded-none border-0" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/65 via-primary/25 to-foreground/70" />
            <div className="absolute bottom-0 right-0 h-[42%] w-[84%] -skew-x-12 bg-foreground" />
            <p className="absolute bottom-[16%] right-[14%] text-[10px] font-semibold uppercase text-background">Drive with confidence</p>
          </motion.div>
        </section>

        <section id="courses" className="mx-auto max-w-7xl scroll-mt-20 px-5 pb-12 md:px-8">
          <SectionHeading eyebrow="Lộ trình học" title={coursesTitle} />
          <div className="grid gap-3 md:grid-cols-2">
            <CourseSummary icon={Bike} title="Xe Máy" items={motorbikeInfo.items} onClick={() => setMotorbikeOpen(true)} />
            <CourseSummary icon={Car} title="Ô Tô" items={carInfo.items} onClick={() => setCarOpen(true)} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.slice(0, 4).map((stat, index) => {
              const Icon = iconMap[stat.icon] || Users;
              return <motion.div {...reveal} transition={{ duration: 0.5, delay: index * 0.05 }} key={index} className="golden-card p-5 text-center"><Icon className="mx-auto mb-3 text-primary" /><strong className="block text-2xl text-primary">{stat.value}</strong><span className="text-xs text-muted-foreground">{stat.label}</span></motion.div>;
            })}
          </div>
        </section>

        <section id="services" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-12 md:px-8">
          <SectionHeading eyebrow="Một hệ icon mới" title={servicesInfo.title} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {servicesInfo.items?.map((item: any, index: number) => {
              const Icon = iconMap[item.icon] || Wrench;
              return <motion.div {...reveal} key={index} className="golden-card p-5"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary"><Icon /></div><h3 className="font-bold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.desc}</p></motion.div>;
            })}
          </div>
        </section>

        <section id="about" className="border-y border-border bg-card/50 px-5 py-16 scroll-mt-20 md:px-8">
          <motion.div {...reveal} className="mx-auto max-w-5xl text-center">
            <SectionHeading eyebrow="Về trung tâm" title={aboutInfo.title} centered />
            <p className="mx-auto max-w-3xl leading-7 text-muted-foreground">{aboutInfo.description}</p>
            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {aboutInfo.highlights?.map((item: any, index: number) => { const Icon = iconMap[item.icon] || Award; return <div key={index} className="golden-card p-5"><Icon className="mx-auto mb-3 text-primary" /><h3 className="font-bold">{item.title}</h3><p className="mt-2 text-sm text-muted-foreground">{item.desc}</p></div>; })}
            </div>
          </motion.div>
        </section>

        <section id="gallery" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-16 md:px-8">
          <SectionHeading eyebrow="Không gian đào tạo" title={galleryInfo.title || heroGallery.title} />
          <div className="grid auto-rows-[180px] grid-cols-2 gap-3 md:grid-cols-4">
            {(galleryInfo.images?.length ? galleryInfo.images : heroSlides).slice(0, 5).map((item: any, index: number) => (
              <div key={index} className={`relative overflow-hidden rounded-md border border-border ${index === 0 ? "col-span-2 row-span-2" : ""}`}>
                {item.url ? <img src={item.url} alt={item.caption || ""} className="h-full w-full object-cover" /> : <RotatingImage images={item.images || []} caption={item.caption} className="h-full rounded-none border-0" />}
              </div>
            ))}
          </div>
        </section>

        <section id="documents" className="border-y border-border bg-card/50 px-5 py-16 scroll-mt-20 md:px-8">
          <div className="mx-auto max-w-5xl"><SectionHeading eyebrow="Tài nguyên học tập" title={documentsInfo.title} />
            <div className="grid gap-3 md:grid-cols-2">{documentsInfo.items?.map((item: any, index: number) => <a key={index} href={item.url} target="_blank" rel="noreferrer" className="golden-card flex items-center gap-4 p-5"><FileText className="text-primary" /><div className="min-w-0 flex-1"><h3 className="font-bold">{item.title}</h3><p className="truncate text-sm text-muted-foreground">{item.desc}</p></div><Download className="text-primary" /></a>)}</div>
          </div>
        </section>

        <section id="contact" className="mx-auto max-w-5xl scroll-mt-20 px-5 py-16 md:px-8">
          <SectionHeading eyebrow="Kết nối cùng chúng tôi" title={contactInfo.title} centered />
          <div className="grid gap-3 md:grid-cols-2">
            <ContactItem icon={MapPin} title="Địa chỉ" value={contactInfo.address} />
            <ContactItem icon={Phone} title="Điện thoại" value={contactInfo.phone} />
            <ContactItem icon={Mail} title="Email" value={contactInfo.email} />
            <ContactItem icon={Clock} title="Giờ làm việc" value={contactInfo.hours} />
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-5 py-8 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} {brandName}. {footerNote || "All rights reserved."}</footer>

      <CourseDialog open={motorbikeOpen} onOpenChange={setMotorbikeOpen} title={motorbikeInfo.title} items={motorbikeInfo.items} />
      <CourseDialog open={carOpen} onOpenChange={setCarOpen} title={carInfo.title} items={carInfo.items} />
      <ContactWidget />
      <ChatWidget />
    </div>
  );
}

function SectionHeading({ eyebrow, title, centered = false }: { eyebrow: string; title: string; centered?: boolean }) {
  return <div className={`mb-7 ${centered ? "text-center" : ""}`}><p className="text-xs font-bold uppercase text-primary">{eyebrow}</p><h2 className="mt-1 text-2xl font-extrabold md:text-3xl">{title}</h2></div>;
}

function CourseSummary({ icon: Icon, title, items, onClick }: { icon: any; title: string; items: any[]; onClick: () => void }) {
  return <Button variant="outline" onClick={onClick} className="golden-card h-auto min-h-24 justify-start gap-4 p-4 text-left"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary"><Icon /></span><span><strong className="block text-base">{title}</strong><small className="text-muted-foreground">{items.map((item) => item.type).join(" · ")} · Xem chi tiết →</small></span></Button>;
}

function ContactItem({ icon: Icon, title, value }: { icon: any; title: string; value: string }) {
  return <div className="golden-card flex items-start gap-4 p-5"><Icon className="mt-1 text-primary" /><div><h3 className="font-bold">{title}</h3><p className="text-sm text-muted-foreground">{value}</p></div></div>;
}

function CourseDialog({ open, onOpenChange, title, items }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; items: any[] }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="landing-theme-2 border-border bg-background"><DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader><div className="space-y-3">{items.map((item) => <div key={item.type} className="golden-card p-4"><div className="flex justify-between gap-4"><strong>Hạng {item.type}</strong><span className="font-bold text-primary">{item.fee}</span></div><p className="mt-2 text-sm text-muted-foreground">{item.desc} · {item.duration}</p></div>)}</div></DialogContent></Dialog>;
}