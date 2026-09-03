import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Home, LogIn, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, getRoleDashboardPath } from "@/hooks/useAuth";
import { toast } from "sonner";

const TEST_PASSWORD = "Driveschool@2026";

const TEST_ACCOUNTS: { email: string; name: string; role: string; label: string; color: string }[] = [
  { email: "superadmin@driveschool.vn", name: "Super Admin", role: "superadmin", label: "SUPERADMIN", color: "gradient-primary text-primary-foreground" },
  { email: "admin@driveschool.vn", name: "Nguyễn Văn Admin", role: "admin", label: "ADMIN", color: "bg-orange-500 text-primary-foreground" },
  { email: "teacher1@driveschool.vn", name: "Trần Minh Thầy", role: "teacher", label: "GIÁO VIÊN", color: "gradient-accent text-accent-foreground" },
  { email: "teacher2@driveschool.vn", name: "Lê Thị Cô", role: "teacher", label: "GIÁO VIÊN", color: "gradient-accent text-accent-foreground" },
  { email: "staff1@driveschool.vn", name: "Phạm Nhân Viên", role: "staff", label: "NHÂN VIÊN", color: "bg-yellow-500 text-foreground" },
  { email: "staff2@driveschool.vn", name: "Hoàng Văn Staff", role: "staff", label: "NHÂN VIÊN", color: "bg-yellow-500 text-foreground" },
  { email: "hocvien1@driveschool.vn", name: "Đỗ Thanh Học", role: "client", label: "HỌC VIÊN", color: "bg-sky-500 text-primary-foreground" },
  { email: "hocvien2@driveschool.vn", name: "Vũ Ngọc Mai", role: "client", label: "HỌC VIÊN", color: "bg-sky-500 text-primary-foreground" },
  { email: "hocvien3@driveschool.vn", name: "Bùi Đức Anh", role: "client", label: "HỌC VIÊN", color: "bg-sky-500 text-primary-foreground" },
  { email: "hocvien4@driveschool.vn", name: "Ngô Phương Linh", role: "client", label: "HỌC VIÊN", color: "bg-sky-500 text-primary-foreground" },
  { email: "hocvien5@driveschool.vn", name: "Lý Minh Tuấn", role: "client", label: "HỌC VIÊN", color: "bg-sky-500 text-primary-foreground" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error("Đăng nhập thất bại", { description: error.message });
      setIsLoading(false);
      return;
    }

    // Fetch profile to get role and redirect (with retry to handle propagation delay)
    const { supabase } = await import("@/lib/supabase");
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      let profile = null;
      for (let i = 0; i < 5; i++) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (data) { profile = data; break; }
        await new Promise((r) => setTimeout(r, 300));
      }

      if (profile) {
        toast.success("Đăng nhập thành công!");
        navigate(getRoleDashboardPath(profile.role), { replace: true });
      } else {
        toast.error("Không tìm thấy hồ sơ người dùng. Vui lòng liên hệ quản trị viên.");
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background grid-bg p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full gradient-primary opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full gradient-secondary opacity-20 blur-3xl" />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card w-full rounded-2xl p-8"
      >
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">
            <span className="gradient-text">DriveMaster</span>
          </h1>
          <p className="text-muted-foreground">Đăng nhập vào hệ thống quản lý</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <Button type="submit" variant="hero" size="lg" className="w-full rounded-xl" disabled={isLoading}>
            <LogIn size={20} />
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>
      </motion.div>

      {/* Test accounts — click to autofill */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-card w-full rounded-2xl p-5"
      >
        <div className="mb-3 flex items-center gap-2">
          <Users size={18} className="text-primary" />
          <h2 className="text-sm font-bold text-foreground">Tài khoản thử nghiệm — nhấn để tự điền</h2>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Mật khẩu chung: <span className="font-mono font-semibold text-foreground">{TEST_PASSWORD}</span>
        </p>
        <div className="grid max-h-[26rem] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {TEST_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => {
                setEmail(a.email);
                setPassword(TEST_PASSWORD);
                toast.success(`Đã điền: ${a.name}`);
              }}
              className="rounded-xl border border-border/60 bg-background/40 p-3 text-left transition-all hover:border-primary/60 hover:bg-primary/5"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold text-foreground">{a.name}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${a.color}`}>{a.label}</span>
              </div>
              <span className="block truncate text-xs text-muted-foreground">{a.email}</span>
            </button>
          ))}
        </div>
      </motion.div>
      </div>
    </div>
  );
}
