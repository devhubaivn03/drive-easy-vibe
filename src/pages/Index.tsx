import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ContactWidget } from "@/components/landing/ContactWidget";
import { ChatWidget } from "@/components/landing/ChatWidget";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Bike, Car, LogIn, GraduationCap, Clock, Award, Users } from "lucide-react";

const motorbikeInfo = {
  title: "Bằng lái Xe Máy",
  items: [
    { type: "A1", desc: "Xe máy dưới 175cc", duration: "1–2 tháng", fee: "500.000đ" },
    { type: "A2", desc: "Xe máy trên 175cc", duration: "2–3 tháng", fee: "800.000đ" },
  ],
};

const carInfo = {
  title: "Bằng lái Ô Tô",
  items: [
    { type: "B1", desc: "Ô tô dưới 9 chỗ (không hành nghề)", duration: "3–4 tháng", fee: "6.000.000đ" },
    { type: "B2", desc: "Ô tô dưới 9 chỗ (hành nghề)", duration: "4–6 tháng", fee: "8.000.000đ" },
    { type: "C", desc: "Xe tải trên 3.5 tấn", duration: "6–8 tháng", fee: "10.000.000đ" },
  ],
};

const stats = [
  { icon: Users, value: "10,000+", label: "Học viên" },
  { icon: GraduationCap, value: "98%", label: "Tỷ lệ đậu" },
  { icon: Clock, value: "10+", label: "Năm kinh nghiệm" },
  { icon: Award, value: "50+", label: "Giáo viên" },
];

export default function LandingPage() {
  const [motorbikeOpen, setMotorbikeOpen] = useState(false);
  const [carOpen, setCarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background grid-bg overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 z-40 w-full glass-card border-b border-border/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <span className="text-xl font-extrabold gradient-text">🚗 DriveMaster</span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="hero" size="sm" className="rounded-xl">
                <LogIn size={16} />
                Đăng nhập
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-16">
        {/* Background blobs */}
        <div className="absolute -top-20 left-1/4 h-96 w-96 rounded-full gradient-primary opacity-10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full gradient-secondary opacity-10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full gradient-accent opacity-10 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 text-center"
        >
          <h1 className="mb-4 text-4xl font-extrabold leading-tight md:text-6xl lg:text-7xl">
            Học Lái Xe —{" "}
            <span className="gradient-text">Dễ Dàng</span>{" "}
            &{" "}
            <span className="gradient-text-accent">Tự Tin</span>
          </h1>
          <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground">
            Trung tâm đào tạo lái xe uy tín hàng đầu Việt Nam. Cam kết đậu 100% với phương pháp giảng dạy hiện đại.
          </p>
        </motion.div>

        {/* Vehicle cards */}
        <div className="relative z-10 flex flex-col gap-8 md:flex-row">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            whileHover={{ scale: 1.05, rotateY: 5 }}
            onClick={() => setMotorbikeOpen(true)}
            className="group cursor-pointer glass-card rounded-3xl p-8 w-72 text-center transition-all duration-500 hover:shadow-2xl"
            style={{ perspective: "1000px" }}
          >
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary">
              <Bike className="h-10 w-10 text-primary-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">🏍️ Xe Máy</h3>
            <p className="text-sm text-muted-foreground">Bằng A1, A2 — Nhanh chóng, tiện lợi</p>
            <div className="mt-4 text-xs font-semibold text-primary">Nhấn để xem chi tiết →</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            whileHover={{ scale: 1.05, rotateY: -5 }}
            onClick={() => setCarOpen(true)}
            className="group cursor-pointer glass-card rounded-3xl p-8 w-72 text-center transition-all duration-500 hover:shadow-2xl"
            style={{ perspective: "1000px" }}
          >
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl gradient-secondary">
              <Car className="h-10 w-10 text-secondary-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">🚗 Ô Tô</h3>
            <p className="text-sm text-muted-foreground">Bằng B1, B2, C — Chuyên nghiệp, bài bản</p>
            <div className="mt-4 text-xs font-semibold text-secondary">Nhấn để xem chi tiết →</div>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="relative z-10 mt-20 grid grid-cols-2 gap-6 md:grid-cols-4"
        >
          {stats.map((stat, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 text-center">
              <stat.icon className="mx-auto mb-2 h-8 w-8 text-primary" />
              <div className="text-2xl font-extrabold gradient-text">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Motorbike Dialog */}
      <Dialog open={motorbikeOpen} onOpenChange={setMotorbikeOpen}>
        <DialogContent className="glass-card border-border/50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold gradient-text">🏍️ {motorbikeInfo.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {motorbikeInfo.items.map((item) => (
              <div key={item.type} className="rounded-xl border border-border/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg text-foreground">Hạng {item.type}</span>
                  <span className="gradient-primary rounded-full px-3 py-1 text-xs font-semibold text-primary-foreground">{item.fee}</span>
                </div>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
                <p className="text-sm text-muted-foreground">⏱ Thời gian: {item.duration}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Car Dialog */}
      <Dialog open={carOpen} onOpenChange={setCarOpen}>
        <DialogContent className="glass-card border-border/50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold gradient-text">🚗 {carInfo.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {carInfo.items.map((item) => (
              <div key={item.type} className="rounded-xl border border-border/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg text-foreground">Hạng {item.type}</span>
                  <span className="gradient-secondary rounded-full px-3 py-1 text-xs font-semibold text-secondary-foreground">{item.fee}</span>
                </div>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
                <p className="text-sm text-muted-foreground">⏱ Thời gian: {item.duration}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Widgets */}
      <ContactWidget />
      <ChatWidget />
    </div>
  );
}
