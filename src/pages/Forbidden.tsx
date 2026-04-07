import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";

export default function Forbidden() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <ShieldX size={64} className="mb-4 text-destructive" />
      <h1 className="mb-2 text-3xl font-bold text-foreground">403 — Truy cập bị từ chối</h1>
      <p className="mb-6 text-muted-foreground">Bạn không có quyền truy cập trang này.</p>
      <Link to="/login">
        <Button variant="hero" className="rounded-xl">Quay lại đăng nhập</Button>
      </Link>
    </div>
  );
}
