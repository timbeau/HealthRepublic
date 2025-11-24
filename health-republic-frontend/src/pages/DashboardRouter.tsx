// src/pages/DashboardRouter.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

import MemberDashboard from "./MemberDashboard";
import SupplierDashboard from "./SupplierDashboard";
import AdminDashboard from "./AdminDashboard";
import type { MeResponse } from "../api/client";

export default function DashboardRouter() {
  const { user, isLoadingProfile } = useAuth();

  // Still loading the profile from /dashboard/me
  if (isLoadingProfile) {
    return <div className="p-6">Loading profile...</div>;
  }

  // Not logged in → go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Build a MeResponse-shaped object for SupplierDashboard,
  // which still expects `me: MeResponse` as a prop.
  const me: MeResponse = {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    },
    sections: {
      headline: `Welcome back, ${user.full_name || user.email}`,
      role: user.role,
    },
  };

  const role = user.role;

  return (
    <Routes>
      {/* Member routes */}
      {role === "member" && (
        <Route path="*" element={<MemberDashboard />} />
      )}

      {/* Supplier routes */}
      {role === "supplier" && (
        <Route path="*" element={<SupplierDashboard me={me} />} />
      )}

      {/* Admin routes */}
      {role === "admin" && (
        <Route path="*" element={<AdminDashboard />} />
      )}

      {/* Fallback for unexpected roles */}
      <Route
        path="*"
        element={<div className="p-6">Unknown role: {role}</div>}
      />
    </Routes>
  );
}
