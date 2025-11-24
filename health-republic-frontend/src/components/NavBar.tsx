// src/components/NavBar.tsx
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function NavBar() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <nav className="w-full bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">

        {/* --- LEFT: Logo --- */}
        <Link
          to={isAuthenticated ? "/dashboard" : "/"}
          className="flex items-center gap-2"
        >
          <img
            src="/logo.png"
            alt="Health Republic"
            className="w-8 h-8 rounded"
          />
          <span className="font-semibold text-lg text-slate-800">
            Health Republic
          </span>
        </Link>

        {/* --- RIGHT: Menu Links --- */}
        <div className="flex items-center gap-6">

          {!isAuthenticated && (
            <>
              <Link
                to="/login"
                className="text-sm text-slate-700 hover:text-slate-900"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm text-slate-700 hover:text-slate-900"
              >
                Register
              </Link>
            </>
          )}

          {isAuthenticated && user && (
            <>
              {/* Role badge */}
              <span className="text-xs px-2 py-1 bg-slate-100 rounded-full border text-slate-600">
                {user.role}
              </span>

              <span className="text-sm text-slate-700">
                {user.full_name || user.email}
              </span>

              <button
                onClick={logout}
                className="text-xs bg-slate-900 text-white px-3 py-1 rounded-lg hover:bg-slate-700"
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
