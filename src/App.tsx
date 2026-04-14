import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Forbidden from "./pages/Forbidden";

import SuperadminDashboard, { SuperadminUsers, SuperadminLeads, SuperadminChat, SuperadminSettings } from "./pages/SuperadminDashboard";
import SuperadminSiteContent from "./pages/SuperadminSiteContent";
import AdminDashboard, { AdminStaff, AdminTeachers, AdminClients, AdminSettings } from "./pages/AdminDashboard";
import AdminLeads from "./pages/AdminLeads";
import AdminChat from "./pages/AdminChat";
import StaffDashboard, { StaffClients, StaffLeads, StaffChat, StaffSettings } from "./pages/StaffDashboard";
import TeacherDashboard, { TeacherSettings } from "./pages/TeacherDashboard";
import ClientDashboard, { ClientNotifications, ClientSettings } from "./pages/ClientDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/403" element={<Forbidden />} />

            {/* Superadmin */}
            <Route path="/superadmin" element={<ProtectedRoute allowedRoles={["superadmin"]}><SuperadminDashboard /></ProtectedRoute>} />
            <Route path="/superadmin/users" element={<ProtectedRoute allowedRoles={["superadmin"]}><SuperadminUsers /></ProtectedRoute>} />
            <Route path="/superadmin/leads" element={<ProtectedRoute allowedRoles={["superadmin"]}><SuperadminLeads /></ProtectedRoute>} />
            <Route path="/superadmin/chat" element={<ProtectedRoute allowedRoles={["superadmin"]}><SuperadminChat /></ProtectedRoute>} />
            <Route path="/superadmin/settings" element={<ProtectedRoute allowedRoles={["superadmin"]}><SuperadminSettings /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={["admin"]}><AdminStaff /></ProtectedRoute>} />
            <Route path="/admin/teachers" element={<ProtectedRoute allowedRoles={["admin"]}><AdminTeachers /></ProtectedRoute>} />
            <Route path="/admin/clients" element={<ProtectedRoute allowedRoles={["admin"]}><AdminClients /></ProtectedRoute>} />
            <Route path="/admin/leads" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLeads /></ProtectedRoute>} />
            <Route path="/admin/chat" element={<ProtectedRoute allowedRoles={["admin"]}><AdminChat /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSettings /></ProtectedRoute>} />

            {/* Staff */}
            <Route path="/staff" element={<ProtectedRoute allowedRoles={["staff"]}><StaffDashboard /></ProtectedRoute>} />
            <Route path="/staff/clients" element={<ProtectedRoute allowedRoles={["staff"]}><StaffClients /></ProtectedRoute>} />
            <Route path="/staff/leads" element={<ProtectedRoute allowedRoles={["staff"]}><StaffLeads /></ProtectedRoute>} />
            <Route path="/staff/chat" element={<ProtectedRoute allowedRoles={["staff"]}><StaffChat /></ProtectedRoute>} />
            <Route path="/staff/settings" element={<ProtectedRoute allowedRoles={["staff"]}><StaffSettings /></ProtectedRoute>} />

            {/* Teacher */}
            <Route path="/teacher" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/settings" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherSettings /></ProtectedRoute>} />

            {/* Client */}
            <Route path="/client" element={<ProtectedRoute allowedRoles={["client"]}><ClientDashboard /></ProtectedRoute>} />
            <Route path="/client/notifications" element={<ProtectedRoute allowedRoles={["client"]}><ClientNotifications /></ProtectedRoute>} />
            <Route path="/client/settings" element={<ProtectedRoute allowedRoles={["client"]}><ClientSettings /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
