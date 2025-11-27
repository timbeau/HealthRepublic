// src/pages/SupplierDashboard.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { fetchSupplierNegotiations } from "../api/client";
import type { SupplierDashboardResponse } from "../api/client";

export default function SupplierDashboard() {
  const { user, accessToken, logout } = useAuth();
  const [data, setData] = useState<SupplierDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
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

    fetchSupplierNegotiations(accessToken)
      .then((res) => {
        if (cancelled) return;
        setData(res);
      })
      .catch((err: any) => {
        if (cancelled) return;
        console.error("Failed to load supplier dashboard", err);
        setError(err.message || "Failed to load supplier dashboard");
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

  const openCount = data?.open_negotiations.length ?? 0;
  const closedCount = data?.closed_negotiations.length ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <div>
          <h1 className="text-xl font-semibold">Supplier Portal</h1>
          <p className="text-xs text-slate-500">
            View and respond to collective negotiations
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
        {/* Summary cards */}
        <section>
          <h2 className="text-sm font-semibold mb-2 text-slate-700">
            Negotiation overview
          </h2>
          {loading && (
            <p className="text-xs text-slate-500">Loading negotiations…</p>
          )}
          {error && (
            <p className="text-xs text-red-600 break-all">Error: {error}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl shadow p-4">
              <div className="text-xs text-slate-500">Open / In progress</div>
              <div className="text-2xl font-semibold mt-1">{openCount}</div>
            </div>
            <div className="bg-white rounded-2xl shadow p-4">
              <div className="text-xs text-slate-500">Closed / Agreed</div>
              <div className="text-2xl font-semibold mt-1">{closedCount}</div>
            </div>
            <div className="bg-white rounded-2xl shadow p-4">
              <div className="text-xs text-slate-500">Total</div>
              <div className="text-2xl font-semibold mt-1">
                {openCount + closedCount}
              </div>
            </div>
          </div>
        </section>

        {/* Open negotiations */}
        <section className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">
              Open negotiations
            </h2>
          </div>
          {data && data.open_negotiations.length === 0 && (
            <p className="text-xs text-slate-500">
              You currently have no open negotiations.
            </p>
          )}
          {data && data.open_negotiations.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border border-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-200 px-2 py-1 text-left">
                      ID
                    </th>
                    <th className="border border-slate-200 px-2 py-1 text-left">
                      Collective
                    </th>
                    <th className="border border-slate-200 px-2 py-1 text-right">
                      Target PMPM
                    </th>
                    <th className="border border-slate-200 px-2 py-1 text-right">
                      Last PMPM
                    </th>
                    <th className="border border-slate-200 px-2 py-1 text-left">
                      Last Actor
                    </th>
                    <th className="border border-slate-200 px-2 py-1 text-left">
                      Updated
                    </th>
                    <th className="border border-slate-200 px-2 py-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.open_negotiations.map((n) => (
                    <tr key={n.id}>
                      <td className="border border-slate-200 px-2 py-1">
                        {n.id}
                      </td>
                      <td className="border border-slate-200 px-2 py-1">
                        #{n.collective_id}
                      </td>
                      <td className="border border-slate-200 px-2 py-1 text-right">
                        {n.target_pmpm ?? "-"}
                      </td>
                      <td className="border border-slate-200 px-2 py-1 text-right">
                        {n.last_round_pmpm ?? "-"}
                      </td>
                      <td className="border border-slate-200 px-2 py-1 capitalize">
                        {n.last_round_actor ?? "-"}
                      </td>
                      <td className="border border-slate-200 px-2 py-1">
                        {n.last_round_created_at
                          ? new Date(
                              n.last_round_created_at
                            ).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="border border-slate-200 px-2 py-1 text-right">
                        <Link
                          to={`/dashboard/negotiations/${n.id}`}
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          Open →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Closed negotiations */}
        <section className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">
              Closed / agreed negotiations
            </h2>
          </div>
          {data && data.closed_negotiations.length === 0 && (
            <p className="text-xs text-slate-500">
              You have no closed or agreed negotiations yet.
            </p>
          )}
          {data && data.closed_negotiations.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border border-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-200 px-2 py-1 text-left">
                      ID
                    </th>
                    <th className="border border-slate-200 px-2 py-1 text-left">
                      Collective
                    </th>
                    <th className="border border-slate-200 px-2 py-1 text-right">
                      Target PMPM
                    </th>
                    <th className="border border-slate-200 px-2 py-1 text-right">
                      Final PMPM
                    </th>
                    <th className="border border-slate-200 px-2 py-1 text-left">
                      Status
                    </th>
                    <th className="border border-slate-200 px-2 py-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.closed_negotiations.map((n) => (
                    <tr key={n.id}>
                      <td className="border border-slate-200 px-2 py-1">
                        {n.id}
                      </td>
                      <td className="border border-slate-200 px-2 py-1">
                        #{n.collective_id}
                      </td>
                      <td className="border border-slate-200 px-2 py-1 text-right">
                        {n.target_pmpm ?? "-"}
                      </td>
                      <td className="border border-slate-200 px-2 py-1 text-right">
                        {n.final_agreed_pmpm ?? "-"}
                      </td>
                      <td className="border border-slate-200 px-2 py-1 capitalize">
                        {n.status}
                      </td>
                      <td className="border border-slate-200 px-2 py-1 text-right">
                        <Link
                          to={`/dashboard/negotiations/${n.id}`}
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
