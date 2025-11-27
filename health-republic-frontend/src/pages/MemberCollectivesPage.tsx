// src/pages/MemberCollectivesPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  fetchCollectivesWithStats,
  joinCollective,
  leaveCollective,
} from "../api/client";
import type { CollectiveSummary } from "../api/client"; // ✅ type-only import


export default function MemberCollectivesPage() {
  const { accessToken, collective } = useAuth();

  const [collectives, setCollectives] = useState<CollectiveSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchCollectivesWithStats()
      .then((data) => {
        setCollectives(data);
      })
      .catch((err: any) => {
        console.error("Failed to load collectives", err);
        setError(err.message || "Failed to load collectives");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChangeCollective = async (id: number) => {
    if (!accessToken) {
      setError("You must be logged in to join a collective.");
      return;
    }
    setJoiningId(id);
    setError(null);

    try {
      // If they already belong to a collective and it's different, leave it first
      if (collective && collective.id && collective.id !== id) {
        await leaveCollective(accessToken, collective.id);
      }

      // If not already in this collective, join it
      if (!collective || !collective.id || collective.id !== id) {
        await joinCollective(accessToken, id);
      }

      // Force a reload so AuthProvider re-fetches /dashboard/me
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Failed to change collective", err);
      setError(err.message || "Failed to change collective");
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-4">
        {/* Top bar with back link */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Browse Collectives</h1>
          <Link
            to="/dashboard"
            className="text-xs px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            ← Back to dashboard
          </Link>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Join or switch collectives to participate in shared health coverage
          negotiations.
        </p>

        {loading && (
          <p className="text-xs text-slate-500">Loading collectives…</p>
        )}

        {error && (
          <p className="text-xs text-red-600 break-all">Error: {error}</p>
        )}

        {!loading && collectives.length === 0 && !error && (
          <p className="text-xs text-slate-500">
            There are no collectives available right now. Please check back
            later.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collectives.map((c) => {
            const isCurrent = collective && collective.id === c.id;

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl shadow p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-sm font-semibold">{c.name}</h2>
                    {isCurrent && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Current
                      </span>
                    )}
                  </div>
                  {c.category && (
                    <p className="text-[11px] text-slate-500 mb-1">
                      Category: {c.category}
                    </p>
                  )}
                  <p className="text-xs text-slate-600 mb-2">
                    Members: {c.member_count}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[11px] text-slate-500">
                    {isCurrent
                      ? "You are currently in this collective."
                      : "Open to new members"}
                  </span>
                  <button
                    disabled={joiningId === c.id || isCurrent}
                    onClick={() => handleChangeCollective(c.id)}
                    className="text-xs px-3 py-1 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 disabled:bg-slate-300"
                  >
                    {isCurrent
                      ? "Current"
                      : joiningId === c.id
                      ? "Updating…"
                      : collective
                      ? "Switch to this collective"
                      : "Join collective"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
