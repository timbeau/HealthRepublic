// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardRouter from "./pages/DashboardRouter";
import RegisterPage from "./pages/RegisterPage";
import SplashPage from "./pages/SplashPage";
import CollectivesPage from "./pages/CollectivesPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import PricingPage from "./pages/PricingPage";
import { AuthProvider } from "./auth/AuthContext";

export default function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider must be inside BrowserRouter so useNavigate works */}
      <AuthProvider>
        <Routes>
          {/* Public marketing */}
          <Route path="/" element={<SplashPage />} />
          <Route path="/collectives" element={<CollectivesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/pricing" element={<PricingPage />} />

          {/* Auth-related */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated app */}
          <Route path="/app/*" element={<DashboardRouter />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
