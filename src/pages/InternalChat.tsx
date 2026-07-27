import { DashboardLayout } from "@/components/DashboardLayout";
import { InternalChatPanel } from "@/components/shared/InternalChatPanel";
import { useAdminNav, useStaffNav, useTeacherNav, useSuperadminNav } from "@/hooks/useRoleNav";

export function SuperadminInternalChat() {
  const navItems = useSuperadminNav();
  return (
    <DashboardLayout navItems={navItems} roleLabel="SUPERADMIN" roleColor="gradient-primary text-primary-foreground">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Chat nội bộ</h1>
      <InternalChatPanel />
    </DashboardLayout>
  );
}

export function AdminInternalChat() {
  const navItems = useAdminNav();
  return (
    <DashboardLayout navItems={navItems} roleLabel="ADMIN" roleColor="bg-orange-500 text-primary-foreground">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Chat nội bộ</h1>
      <InternalChatPanel />
    </DashboardLayout>
  );
}

export function StaffInternalChat() {
  const navItems = useStaffNav();
  return (
    <DashboardLayout navItems={navItems} roleLabel="STAFF" roleColor="bg-yellow-500 text-foreground">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Chat nội bộ</h1>
      <InternalChatPanel />
    </DashboardLayout>
  );
}

export function TeacherInternalChat() {
  const navItems = useTeacherNav();
  return (
    <DashboardLayout navItems={navItems} roleLabel="GIÁO VIÊN" roleColor="gradient-accent text-accent-foreground">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Chat nội bộ</h1>
      <InternalChatPanel />
    </DashboardLayout>
  );
}