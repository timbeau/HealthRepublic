// src/pages/SplashPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchPublicOverview, type PublicOverviewResponse } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function SplashPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

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
        setError(err.message || "Failed to load overview");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handlePrimaryCta = () => {
    if (user) {
      navigate("/app");
    } else {
      navigate("/register");
    }
  };

  const totalMembers = overview?.total_members ?? 0;
  const totalInsurers = overview?.total_insurers ?? 0;
  const totalProviders = overview?.total_providers ?? 0;

  const topCollectives = overview?.collectives.slice(0, 3) ?? [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Top nav */}
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-900">
              HR
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">
                Health Republic
              </div>
              <div className="text-[11px] text-slate-400">
                Collective bargaining for healthcare
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs text-slate-300">
            <Link to="/how-it-works" className="hover:text-white">
              How it works
            </Link>
            <Link to="/collectives" className="hover:text-white">
              Collectives
            </Link>
            <Link to="/pricing" className="hover:text-white">
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden sm:inline text-xs text-slate-300">
                  {user.email}
                </span>
                <button
                  onClick={() => navigate("/app")}
                  className="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-900 font-medium hover:bg-white"
                >
                  Go to dashboard
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-600 text-slate-100 hover:bg-slate-800"
                >
                  Log in
                </Link>
                <button
                  onClick={handlePrimaryCta}
                  className="text-xs px-3 py-1.5 rounded-full bg-emerald-400 text-slate-900 font-medium hover:bg-emerald-300"
                >
                  Get started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero + metrics */}
      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        <section className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-center">
          <div className="space-y-4">
            <p className="inline-flex items-center text-[11px] px-2 py-1 rounded-full bg-slate-900/70 border border-slate-700 text-slate-300">
              New · Virtual collectives for real people
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
              Group bargaining power,
              <span className="block text-emerald-300">
                without giving up your independence.
              </span>
            </h1>
            <p className="text-sm text-slate-300 max-w-lg">
              Health Republic lets individuals, small employers, and freelancers
              band together into purchasing collectives and invite insurers and
              point-of-care providers to bid for their business.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handlePrimaryCta}
                className="px-4 py-2 text-xs rounded-full bg-emerald-400 text-slate-950 font-semibold hover:bg-emerald-300"
              >
                Get started
              </button>
              <Link
                to="/how-it-works"
                className="px-4 py-2 text-xs rounded-full border border-slate-600 text-slate-100 hover:bg-slate-900"
              >
                How it works
              </Link>
              <span className="text-[11px] text-slate-400">
                No fees to join a collective.
              </span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">
                  Members
                </div>
                <div className="text-xl font-semibold">
                  {loading ? "—" : totalMembers}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">
                  Insurers
                </div>
                <div className="text-xl font-semibold">
                  {loading ? "—" : totalInsurers}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">
                  Providers
                </div>
                <div className="text-xl font-semibold">
                  {loading ? "—" : totalProviders}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Live counts based on current collectives in Health Republic.
            </p>
          </div>
        </section>

        {/* Collectives preview */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-100">
              Active collectives
            </h2>
            <Link
              to="/collectives"
              className="text-[11px] text-emerald-300 hover:text-emerald-200"
            >
              View all collectives →
            </Link>
          </div>

          {error && (
            <p className="text-xs text-red-400">
              Error loading overview: {error}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            {(loading || topCollectives.length === 0) && !error ? (
              <p className="text-xs text-slate-400 col-span-3">
                We&apos;re spinning up the first set of collectives…
              </p>
            ) : (
              topCollectives.map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-50">
                      {c.name}
                    </div>
                    {c.category && (
                      <div className="inline-flex text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {c.category}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400">
                      {c.member_count} member
                      {c.member_count === 1 ? "" : "s"} in this collective
                    </div>
                  </div>

                  <div className="mt-3">
                    <Link
                      to={`/register?collective_id=${c.id}&collective_name=${encodeURIComponent(
                        c.name
                      )}`}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-[11px] rounded-full bg-emerald-400 text-slate-950 font-medium hover:bg-emerald-300"
                    >
                      Join this collective
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
