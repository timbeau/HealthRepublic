// src/pages/DashboardRouter.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

import MemberDashboard from "./MemberDashboard";
import SupplierDashboard from "./SupplierDashboard";
import AdminDashboard from "./AdminDashboard";
import CollectivesAdminPage from "./CollectivesAdminPage";
import AdminUsersPage from "./AdminUsersPage";

export default function DashboardRouter() {
  const { user, isLoadingProfile } = useAuth();

  if (isLoadingProfile) {
    return <div className="p-6 text-sm text-slate-500">Loading profile…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role;

  if (role === "admin") {
    return (
      <Routes>
        {/* /app */}
        <Route path="" element={<AdminDashboard />} />
        {/* /app/admin/users */}
        <Route path="admin/users" element={<AdminUsersPage />} />
        {/* /app/admin/collectives */}
        <Route path="admin/collectives" element={<CollectivesAdminPage />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/app" replace />} />
        <Route path="admin/users" element={<AdminUsersPage />} />
      </Routes>
    );
  }

  if (role === "supplier") {
    return (
      <Routes>
        <Route path="" element={<SupplierDashboard />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    );
  }

  // Default: member
  return (
    <Routes>
      <Route path="" element={<MemberDashboard />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
