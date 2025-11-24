// src/pages/MemberDashboard.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import type { Negotiation } from "../api/client";
import { fetchMemberNegotiations } from "../api/client";

export default function MemberDashboard() {
  const { user, accessToken, logout } = useAuth();

  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [stats, setStats] = useState({ total: 0, open: 0, agreed: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      setError("Missing access token");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchMemberNegotiations(accessToken)
      .then((data) => {
        if (cancelled) return;

        setNegotiations(data);

        const total = data.length;
        const open = data.filter((n) =>
          ["open", "in_progress"].includes(n.status)
        ).length;
        const agreed = data.filter((n) => n.status === "agreed").length;

        setStats({ total, open, agreed });
      })
      .catch((err: any) => {
        if (cancelled) return;
        console.error("Failed to load negotiations", err);
        setError(err.message || "Failed to load negotiations");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (!user) {
    return <div className="p-6 text-sm text-slate-700">Not logged in.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <div>
          <h1 className="text-xl font-semibold">Member Dashboard</h1>
          <p className="text-xs text-slate-500">
            Your collective activity and negotiations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium">
              {user.full_name || user.email}
            </div>
            <div className="text-xs text-slate-500">Role: {user.role}</div>
          </div>
          <button
            onClick={logout}
            className="text-xs px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Intro */}
        <section>
          <p className="text-base">
            Welcome back{" "}
            <span className="font-semibold">
              {user.full_name || user.email}
            </span>
            .
          </p>
          <p className="text-sm text-slate-600 mt-1">
            Here&apos;s a snapshot of your current negotiations.
          </p>
        </section>

        {/* Stats cards */}
        <section>
          <h2 className="text-sm font-semibold mb-2 text-slate-700">
            Your negotiations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl shadow p-4">
              <div className="text-xs text-slate-500">Total negotiations</div>
              <div className="text-2xl font-semibold mt-1">{stats.total}</div>
            </div>
            <div className="bg-white rounded-2xl shadow p-4">
              <div className="text-xs text-slate-500">
                Open / In progress
              </div>
              <div className="text-2xl font-semibold mt-1">{stats.open}</div>
            </div>
            <div className="bg-white rounded-2xl shadow p-4">
              <div className="text-xs text-slate-500">Agreed deals</div>
              <div className="text-2xl font-semibold mt-1">{stats.agreed}</div>
            </div>
          </div>
        </section>

        {/* Table + errors */}
        <section className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">
              Negotiation details
            </h2>
            {loading && (
              <span className="text-xs text-slate-500">
                Loading negotiations…
              </span>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-600 mb-2 break-all">
              Error: {error}
            </p>
          )}

          {!loading && !error && negotiations.length === 0 && (
            <p className="text-xs text-slate-500">
              You have no negotiations yet. Once a collective starts negotiating
              on your behalf, they will appear here.
            </p>
          )}

          {!loading && negotiations.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border border-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-200 px-2 py-1 text-left">
                      ID
                    </th>
                    <th className="border border-slate-200 px-2 py-1 text-left">
                      Status
                    </th>
                    <th className="border border-slate-200 px-2 py-1 text-right">
                      Target PMPM
                    </th>
                    <th className="border border-slate-200 px-2 py-1 text-right">
                      Final PMPM
                    </th>
                    <th className="border border-slate-200 px-2 py-1 text-right">
                      Final MLR
                    </th>
                    <th className="border border-slate-200 px-2 py-1 text-left">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {negotiations.map((n) => (
                    <tr key={n.id}>
                      <td className="border border-slate-200 px-2 py-1">
                        {n.id}
                      </td>
                      <td className="border border-slate-200 px-2 py-1 capitalize">
                        {n.status}
                      </td>
                      <td className="border border-slate-200 px-2 py-1 text-right">
                        {n.target_pmpm != null ? n.target_pmpm : "-"}
                      </td>
                      <td className="border border-slate-200 px-2 py-1 text-right">
                        {n.final_agreed_pmpm != null
                          ? n.final_agreed_pmpm
                          : "-"}
                      </td>
                      <td className="border border-slate-200 px-2 py-1 text-right">
                        {n.final_expected_mlr != null
                          ? n.final_expected_mlr
                          : "-"}
                      </td>
                      <td className="border border-slate-200 px-2 py-1">
                        {n.created_at
                          ? new Date(n.created_at).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Next steps */}
        <section>
          <h2 className="text-sm font-semibold mb-2 text-slate-700">
            Next steps
          </h2>
          <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
            <li>Review any open / in-progress negotiations above.</li>
            <li>Work with your collective coordinator on counteroffers.</li>
            <li>Watch for agreed deals and final PMPM values.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
