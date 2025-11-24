// src/components/NavBar.tsx
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function NavBar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const onDashboard = location.pathname.startsWith("/app");

  return (
    <nav className="w-full bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Left: Logo / brand */}
        <Link to={user ? "/app" : "/login"} className="flex items-center gap-2">
          {/* Simple logo mark – replace with an <img> if you have a real logo file */}
          <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white">
            HR
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">Health Republic</span>
            <span className="text-[10px] uppercase tracking-wide text-slate-500">
              Collective Benefits
            </span>
          </div>
        </Link>

        {/* Right: nav controls */}
        <div className="flex items-center gap-3 text-xs">
          {user && onDashboard && (
            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600">
              {user.role}
            </span>
          )}

          {!user && (
            <>
              <Link to="/login" className="hover:underline">
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-full border border-slate-900 px-3 py-1 hover:bg-slate-900 hover:text-white"
              >
                Sign up
              </Link>
            </>
          )}

          {user && (
            <>
              <span className="hidden sm:inline text-slate-500">
                {user.email}
              </span>
              <button
                onClick={logout}
                className="rounded-full border border-slate-300 px-3 py-1 hover:bg-slate-100"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
