// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SplashPage from "./pages/SplashPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardRouter from "./pages/DashboardRouter";
import { AuthProvider } from "./auth/AuthContext";

export default function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider must be inside BrowserRouter so useNavigate/useLocation work */}
      <AuthProvider>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<SplashPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated area – this is what /app points to */}
          <Route path="/app/*" element={<DashboardRouter />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
