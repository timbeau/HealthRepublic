// src/pages/CollectivesPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPublicOverview, type PublicOverviewResponse } from "../api/client";

export default function CollectivesPage() {
  const [overview, setOverview] = useState<PublicOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPublicOverview()
      .then((data) => {
        if (cancelled) return;
        setOverview(data);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load public overview", err);
        setError(err.message || "Failed to load collectives");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const collectives = overview?.collectives ?? [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Simple nav reuse */}
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-semibold text-slate-900">
              HR
            </div>
            <span className="text-sm font-semibold">Health Republic</span>
          </Link>

          <nav className="flex items-center gap-5 text-xs text-slate-300">
            <Link to="/how-it-works" className="hover:text-white">
              How it works
            </Link>
            <Link to="/pricing" className="hover:text-white">
              Pricing
            </Link>
            <Link to="/login" className="hover:text-white">
              Log in
            </Link>
            <Link
              to="/register"
              className="px-3 py-1.5 rounded-full bg-emerald-400 text-slate-950 font-medium hover:bg-emerald-300"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Collectives directory</h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Browse the active collectives in Health Republic. Join as an
            individual or enroll your organization and let suppliers bid for
            your population.
          </p>
        </header>

        {error && (
          <p className="text-xs text-red-400">Error: {error}</p>
        )}

        {loading ? (
          <p className="text-xs text-slate-400">Loading collectives…</p>
        ) : collectives.length === 0 ? (
          <p className="text-xs text-slate-400">
            No collectives yet. Be the first to create or sponsor one.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {collectives.map((c) => (
              <div
                key={c.id}
                className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-slate-50">
                    {c.name}
                  </div>
                  {c.category && (
                    <div className="inline-flex text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {c.category}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400">
                    {c.member_count} member
                    {c.member_count === 1 ? "" : "s"} currently enrolled.
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to={`/register?collective_id=${c.id}&collective_name=${encodeURIComponent(
                      c.name
                    )}`}
                    className="inline-flex items-center justify-center px-3 py-1.5 text-[11px] rounded-full bg-emerald-400 text-slate-950 font-medium hover:bg-emerald-300"
                  >
                    Join this collective
                  </Link>
                  <Link
                    to="/how-it-works"
                    className="text-[11px] text-slate-300 hover:text-white"
                  >
                    How does this work?
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
