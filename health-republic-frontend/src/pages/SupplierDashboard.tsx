// src/pages/SupplierDashboard.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import type {
  SupplierNegotiationSummary,
  SupplierDashboardResponse,
} from "../api/client";
import { fetchSupplierNegotiations } from "../api/client";

export default function SupplierDashboard() {
  const { user, accessToken, logout } = useAuth();

  const [data, setData] = useState<SupplierDashboardResponse | null>(null);
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

    fetchSupplierNegotiations(accessToken)
      .then((resp) => {
        if (cancelled) return;
        setData(resp);
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
          <h1 className="text-xl font-semibold">Supplier Dashboard</h1>
          <p className="text-xs text-slate-500">
            Your Health Republic negotiations
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl shadow p-4">
              <div className="text-xs text-slate-500">Open negotiations</div>
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

        {/* Error / loading */}
        <section className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">
              Open negotiations
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

          {!loading &&
            !error &&
            data &&
            data.open_negotiations.length === 0 && (
              <p className="text-xs text-slate-500">
                No open negotiations yet. When collectives invite you to quote,
                they will show up here.
              </p>
            )}

          {!loading && !error && data && data.open_negotiations.length > 0 && (
            <NegotiationTable items={data.open_negotiations} />
          )}
        </section>

        {/* Closed section */}
        <section className="bg-white rounded-2xl shadow p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Closed / agreed negotiations
          </h2>

          {!loading &&
            !error &&
            data &&
            data.closed_negotiations.length === 0 && (
              <p className="text-xs text-slate-500">
                No closed or agreed deals yet.
              </p>
            )}

          {!loading &&
            !error &&
            data &&
            data.closed_negotiations.length > 0 && (
              <NegotiationTable items={data.closed_negotiations} />
            )}
        </section>

        {/* Next steps */}
        <section>
          <h2 className="text-sm font-semibold mb-2 text-slate-700">
            Next steps
          </h2>
          <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
            <li>Review open negotiations and confirm your anchor offers.</li>
            <li>Respond to member or collective counters quickly.</li>
            <li>Track agreed PMPM and MLR for your portfolio.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

type TableProps = {
  items: SupplierNegotiationSummary[];
};

function NegotiationTable({ items }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs border border-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="border border-slate-200 px-2 py-1 text-left">ID</th>
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
              Last Round PMPM
            </th>
            <th className="border border-slate-200 px-2 py-1 text-left">
              Last Actor
            </th>
            <th className="border border-slate-200 px-2 py-1 text-left">
              Updated
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((n) => (
            <tr key={n.id}>
              <td className="border border-slate-200 px-2 py-1">{n.id}</td>
              <td className="border border-slate-200 px-2 py-1 capitalize">
                {n.status}
              </td>
              <td className="border border-slate-200 px-2 py-1 text-right">
                {n.target_pmpm != null ? n.target_pmpm : "-"}
              </td>
              <td className="border border-slate-200 px-2 py-1 text-right">
                {n.final_agreed_pmpm != null ? n.final_agreed_pmpm : "-"}
              </td>
              <td className="border border-slate-200 px-2 py-1 text-right">
                {n.last_round_pmpm != null ? n.last_round_pmpm : "-"}
              </td>
              <td className="border border-slate-200 px-2 py-1">
                {n.last_round_actor ?? "-"}
              </td>
              <td className="border border-slate-200 px-2 py-1">
                {n.updated_at
                  ? new Date(n.updated_at).toLocaleDateString()
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
