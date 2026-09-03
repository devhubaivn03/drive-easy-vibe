import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RotatingImage } from "@/components/landing/RotatingImage";
import { Bike, Car, LogIn, Sparkles, Users, GraduationCap, Clock, Award, Star, Heart, Wrench, FileText, Image as ImageIcon, Info, BookOpen, Phone, Mail, MapPin, Download, ArrowRight } from "lucide-react";

const iconMap: Record<string, any> = {
  Users, GraduationCap, Clock, Award, Bike, Car, Star, Heart,
  Wrench, FileText, ImageIcon, Info, BookOpen, Phone, Mail, MapPin, Download,
};

interface HeroLayout2Props {
  heroTitle1: string;
  heroTitle2: string;
  heroSubtitle: string;
  brandName: string;
  stats: any[];
  motorbikeInfo: any;
  carInfo: any;
  heroSlides: any[];
  onMotorbike: () => void;
  onCar: () => void;
}

function CardShell({ children, className = "", delay = 0 }: { children: any; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: "easeOut" }}
      className={`glass-card bg-card/80 rounded-2xl p-4 ${className}`}
    >
      {children}
    </motion.div>
  );
}

/** Layout 2 — "Editorial Dashboard": tiêu đề ở giữa, các thẻ thông tin dạng dashboard bao quanh. */
export function HeroLayout2({
  heroTitle1, heroTitle2, heroSubtitle, brandName, stats, motorbikeInfo, carInfo, heroSlides, onMotorbike, onCar,
}: HeroLayout2Props) {
  return (
    <section id="home" className="relative overflow-hidden px-4 pb-16 pt-24 lg:pt-28">
      <div className="absolute -top-24 left-1/4 h-96 w-96 rounded-full gradient-primary opacity-20 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full gradient-accent opacity-15 blur-3xl" />

      <div className="container relative z-10 mx-auto max-w-7xl">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)]">
          {/* Cột trái */}
          <div className="order-2 space-y-5 lg:order-1">
            <CardShell delay={0.15} className="cursor-pointer transition hover:shadow-2xl" >
              <button onClick={onMotorbike} className="w-full text-left">
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
                    <Bike className="h-4.5 w-4.5 text-primary-foreground" size={18} />
                  </div>
                  <span className="text-sm font-bold text-foreground">{motorbikeInfo?.title || "Bằng lái Xe Máy"}</span>
                </div>
                <div className="space-y-2">
                  {(motorbikeInfo?.items || []).slice(0, 2).map((it: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
                      <span className="text-xs font-semibold text-foreground">{it.type}</span>
                      <span className="text-[11px] text-muted-foreground">{it.duration} · {it.fee}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary">
                  Xem chi tiết <ArrowRight size={13} />
                </div>
              </button>
            </CardShell>

            <CardShell delay={0.25} className="p-2">
              <RotatingImage
                images={heroSlides?.[0]?.images || []}
                caption={heroSlides?.[0]?.caption}
                className="h-40 w-full border-0 bg-transparent md:h-48"
                showDots={false}
              />
            </CardShell>
          </div>

          {/* Cột giữa — tiêu đề */}
          <div className="order-1 text-center lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary"
            >
              <Sparkles size={13} /> Học lái xe #1 cùng {brandName}
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65 }}
              className="text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground md:text-6xl"
            >
              Học Lái Xe<br />
              <span className="gradient-text">{heroTitle1}</span> &amp;{" "}
              <span className="gradient-text-accent">{heroTitle2}</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="mx-auto mt-5 max-w-md text-base text-muted-foreground"
            >
              {heroSubtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="mt-7 flex flex-wrap items-center justify-center gap-3"
            >
              <Link to="/login">
                <Button variant="hero" size="lg" className="rounded-xl">
                  <LogIn size={16} /> Đăng nhập học ngay
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl"
                onClick={() => document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" })}
              >
                Xem khóa học
              </Button>
            </motion.div>
          </div>

          {/* Cột phải */}
          <div className="order-3 space-y-5">
            <CardShell delay={0.2}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Con số nổi bật</p>
              <div className="grid grid-cols-2 gap-3">
                {(stats || []).slice(0, 4).map((s: any, i: number) => {
                  const Icon = iconMap[s.icon] || Users;
                  return (
                    <div key={i} className="rounded-xl bg-muted/60 p-3">
                      <Icon className="mb-1.5 h-4 w-4 text-primary" />
                      <div className="text-lg font-extrabold gradient-text">{s.value}</div>
                      <div className="text-[11px] text-muted-foreground">{s.label}</div>
                    </div>
                  );
                })}
              </div>
            </CardShell>

            <CardShell delay={0.3} className="cursor-pointer transition hover:shadow-2xl">
              <button onClick={onCar} className="w-full text-left">
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-accent">
                    <Car className="text-primary-foreground" size={18} />
                  </div>
                  <span className="text-sm font-bold text-foreground">{carInfo?.title || "Bằng lái Ô Tô"}</span>
                </div>
                <div className="space-y-2">
                  {(carInfo?.items || []).slice(0, 3).map((it: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
                      <span className="text-xs font-semibold text-foreground">{it.type}</span>
                      <span className="text-[11px] text-muted-foreground">{it.duration} · {it.fee}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary">
                  Xem chi tiết <ArrowRight size={13} />
                </div>
              </button>
            </CardShell>

            <CardShell delay={0.4} className="p-2">
              <RotatingImage
                images={heroSlides?.[1]?.images || []}
                caption={heroSlides?.[1]?.caption}
                className="h-32 w-full border-0 bg-transparent md:h-36"
                showDots={false}
              />
            </CardShell>
          </div>
        </div>
      </div>
    </section>
  );
}
