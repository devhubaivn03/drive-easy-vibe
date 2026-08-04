import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, Users, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, getRoleDashboardPath } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  teacher: "Giáo viên",
  staff: "Nhân viên",
  client: "Học viên",
};

const ROLE_BADGE: Record<string, string> = {
  superadmin: "gradient-primary text-primary-foreground",
  admin: "bg-orange-500 text-primary-foreground",
  teacher: "gradient-accent text-accent-foreground",
  staff: "bg-yellow-500 text-foreground",
  client: "bg-muted text-foreground",
};

const ROLE_ORDER = ["superadmin", "admin", "teacher", "staff", "client"];

interface TestAccount {
  email: string;
  full_name: string;
  role: string;
  branch: string | null;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<TestAccount[]>([]);
  const [defaultPassword, setDefaultPassword] = useState("Driveschool@2026");
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const loadAccounts = async () => {
    setLoadingAccounts(true);
    const { data, error } = await supabase.functions.invoke("list-test-accounts");
    if (!error && data) {
      setAccounts(data.accounts || []);
      if (data.default_password) setDefaultPassword(data.default_password);
    }
    setLoadingAccounts(false);
  };

  useEffect(() => { loadAccounts(); }, []);

  const grouped = useMemo(() => {
    const map: Record<string, TestAccount[]> = {};
    accounts.forEach((a) => {
      map[a.role] = map[a.role] || [];
      map[a.role].push(a);
    });
    return ROLE_ORDER.filter((r) => map[r]?.length).map((r) => ({ role: r, list: map[r] }));
  }, [accounts]);

  const fill = (a: TestAccount) => {
    setEmail(a.email);
    setPassword(defaultPassword);
    toast.success(`Đã điền tài khoản ${a.full_name}`, { description: a.email });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error("Đăng nhập thất bại", { description: error.message });
      setIsLoading(false);
      return;
    }

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
    <div className="relative flex min-h-screen items-center justify-center bg-background grid-bg p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full gradient-primary opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full gradient-secondary opacity-20 blur-3xl" />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">
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

        {/* Test accounts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="glass-card flex w-full flex-col rounded-2xl p-6"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-foreground">
              <Users size={18} /> Tài khoản test
            </h2>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={loadAccounts} title="Tải lại">
              <RefreshCw size={14} className={cn(loadingAccounts && "animate-spin")} />
            </Button>
          </div>
          <div className="mb-3 flex items-center justify-between rounded-xl border border-border/50 px-3 py-2 text-xs">
            <span className="text-muted-foreground">Mật khẩu chung</span>
            <button
              type="button"
              onClick={() => { navigator.clipboard?.writeText(defaultPassword); toast.success("Đã copy mật khẩu"); }}
              className="flex items-center gap-1 font-mono font-semibold text-primary"
            >
              {defaultPassword} <Copy size={12} />
            </button>
          </div>

          <div className="max-h-[52vh] flex-1 space-y-4 overflow-y-auto pr-1">
            {loadingAccounts && <p className="text-sm text-muted-foreground">Đang tải danh sách...</p>}
            {!loadingAccounts && grouped.length === 0 && (
              <p className="text-sm text-muted-foreground">Chưa có tài khoản nào.</p>
            )}
            {grouped.map((g) => (
              <div key={g.role}>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", ROLE_BADGE[g.role])}>
                    {ROLE_LABEL[g.role] || g.role}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{g.list.length} tài khoản</span>
                </div>
                <div className="space-y-1.5">
                  {g.list.map((a) => (
                    <button
                      key={a.email}
                      type="button"
                      onClick={() => fill(a)}
                      className={cn(
                        "w-full rounded-xl border border-border/50 p-2.5 text-left transition-colors hover:border-primary/50 hover:bg-primary/5",
                        email === a.email && "border-primary bg-primary/10"
                      )}
                    >
                      <p className="truncate text-sm font-medium text-foreground">{a.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.email}</p>
                      {a.branch && <p className="truncate text-[10px] italic text-muted-foreground">{a.branch}</p>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Nhấn vào một tài khoản để tự động điền email &amp; mật khẩu. Danh sách này chỉ dùng cho môi trường test.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
