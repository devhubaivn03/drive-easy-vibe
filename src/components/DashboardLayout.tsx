import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Bell, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  roleLabel: string;
  roleColor: string;
}

export function DashboardLayout({ children, navItems, roleLabel, roleColor }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    const fetchNotifs = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(10);
      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
    };
    fetchNotifs();

    const channel = supabase
      .channel("notif-bell")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}` }, (payload) => {
        setNotifications((prev) => [payload.new as any, ...prev].slice(0, 10));
        setUnreadCount((c) => c + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const markAllRead = async () => {
    if (!profile || unreadCount === 0) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", profile.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col gradient-sidebar transition-transform duration-300 md:relative md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between px-5 border-b border-sidebar-border">
          <span className="text-lg font-extrabold text-sidebar-foreground">🚗 DriveSchool</span>
          <button className="text-sidebar-foreground md:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-3">
          <span className={cn("inline-block rounded-full px-3 py-1 text-xs font-bold", roleColor)}>
            {roleLabel}
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-sidebar-accent text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between glass-card border-b border-border/50 px-4 md:px-6">
          <button className="text-foreground md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>

          <div className="hidden md:block" />

          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative" onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) markAllRead(); }}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full gradient-secondary text-[10px] font-bold text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </Button>

              <AnimatePresence>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-12 z-50 w-80 glass-card rounded-2xl overflow-hidden shadow-xl"
                    >
                      <div className="p-4 border-b border-border/50 font-semibold text-foreground text-sm">Thông báo</div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="p-4 text-center text-sm text-muted-foreground">Chưa có thông báo</p>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className={cn("p-3 border-b border-border/30 text-sm", !n.is_read && "bg-primary/5")}>
                              <p className="text-foreground">{n.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("vi-VN")}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span className="hidden text-sm font-medium text-foreground md:block">
                {profile?.full_name}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}