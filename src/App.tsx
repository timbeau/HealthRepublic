// src/App.tsx
import React from "react";
import { useAuth, AuthProvider } from "./auth/AuthContext";
import LoginPage from "./pages/LoginPage";
import MemberDashboard from "./pages/MemberDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import AdminDashboard from "./pages/AdminDashboard";

const AppInner: React.FC = () => {
  const { user, loading, accessToken } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-sm text-slate-600">Loading…</div>
      </div>
    );
  }

  if (!accessToken || !user) {
    return <LoginPage />;
  }

  // Route based on role
  switch (user.role) {
    case "member":
      return <MemberDashboard />;
    case "supplier":
      // Can later branch here on user_type for provider vs insurer
      return <ProviderDashboard />;
    case "admin":
      return <AdminDashboard />;
    default:
      return <MemberDashboard />;
  }
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
};

export default App;
