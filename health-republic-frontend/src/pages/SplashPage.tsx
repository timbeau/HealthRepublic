// src/pages/SplashPage.tsx
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { fetchPublicOverview, type PublicOverviewResponse } from "../api/client";

export default function SplashPage() {
  const [overview, setOverview] = useState<PublicOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    fetchPublicOverview()
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load overview");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* NAVBAR */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-slate-950/60 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          {/* Logo button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 group"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-400 to-cyan-400 shadow-md shadow-emerald-500/30 flex items-center justify-center">
              <span className="text-slate-900 font-bold text-sm">HR</span>
            </div>
            <span className="font-semibold tracking-tight text-white group-hover:text-emerald-300 transition">
              Health Republic
            </span>
          </button>

          {/* UPDATED NAVIGATION USING NavLink */}
          <nav className="flex items-center gap-6 text-sm">

            <NavLink
              to="/login"
              className={({ isActive }) =>
                [
                  "px-4 py-1.5 rounded-full font-medium transition",
                  isActive
                    ? "bg-white text-slate-900"
                    : "text-white/70 hover:text-white"
                ].join(" ")
              }
            >
              Login
            </NavLink>

            <NavLink
              to="/register"
              className={({ isActive }) =>
                [
                  "px-4 py-1.5 rounded-full font-medium transition",
                  isActive
                    ? "bg-emerald-400 text-slate-900"
                    : "bg-white text-slate-900 hover:bg-emerald-400"
                ].join(" ")
              }
            >
              Get Started
            </NavLink>

          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="flex-1 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-white mb-8">
            Health Coverage, Reimagined Together.
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto mb-12">
            Join a collective of individuals, providers, and insurers committed
            to transparent, affordable health care. Built on collaboration, not
            competition.
          </p>

          <div className="flex justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3 rounded-full bg-white text-slate-900 font-semibold hover:bg-emerald-400 transition"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 rounded-full border border-white/30 text-white hover:bg-white/10 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* PLATFORM STATISTICS */}
      <section className="bg-slate-900 border-t border-white/10 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-center text-3xl font-semibold text-white mb-12">
            The Health Republic Community
          </h2>

          {loading && (
            <p className="text-center text-white/50">Loading overview…</p>
          )}

          {error && (
            <p className="text-center text-red-400">Error: {error}</p>
          )}

          {overview && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
              <div className="p-8 rounded-2xl bg-slate-800/40 border border-white/10 shadow-lg">
                <p className="text-5xl font-bold text-emerald-400">
                  {overview.total_members}
                </p>
                <p className="mt-2 text-white/60">Members</p>
              </div>

              <div className="p-8 rounded-2xl bg-slate-800/40 border border-white/10 shadow-lg">
                <p className="text-5xl font-bold text-cyan-400">
                  {overview.total_insurers}
                </p>
                <p className="mt-2 text-white/60">Insurers</p>
              </div>

              <div className="p-8 rounded-2xl bg-slate-800/40 border border-white/10 shadow-lg">
                <p className="text-5xl font-bold text-indigo-400">
                  {overview.total_providers}
                </p>
                <p className="mt-2 text-white/60">Healthcare Providers</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* COLLECTIVES SHOWCASE */}
      {overview && overview.collectives.length > 0 && (
        <section className="bg-slate-950 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-center text-3xl font-semibold text-white mb-14">
              Explore Our Collectives
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {overview.collectives.map((col) => (
                <div
                  key={col.id}
                  className="p-6 rounded-2xl bg-slate-800/40 border border-white/10 hover:border-emerald-400/40 hover:shadow-lg transition"
                >
                  <h3 className="text-xl font-semibold mb-2">{col.name}</h3>
                  <p className="text-white/60 text-sm mb-4">
                    Category: {col.category || "General"}
                  </p>
                  <p className="text-3xl font-bold text-emerald-300">
                    {col.member_count}
                  </p>
                  <p className="text-white/60 text-sm">Members</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="py-10 border-t border-white/10 text-center text-white/40 text-sm">
        Health Republic © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
