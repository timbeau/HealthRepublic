import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { fetchSupplierNegotiations } from "../api/client";

interface SupplierNegotiation {
  id: number;
  collective_id: number;
  supplier_id: number;
  status: string;
  target_pmpm: number | null;
  final_agreed_pmpm: number | null;
  last_round_actor: string | null;
  last_round_pmpm: number | null;
  last_round_mlr: number | null;
  last_round_created_at: string | null;
  updated_at: string;
}

interface SupplierDashboardPayload {
  supplier_id: number;
  email: string;
  open_negotiations: SupplierNegotiation[];
  closed_negotiations: SupplierNegotiation[];
}

const ProviderDashboard: React.FC = () => {
  const { user, accessToken, logout } = useAuth();
  const [data, setData] = useState<SupplierDashboardPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!accessToken) return;
      try {
        setLoading(true);
        setErr(null);
        const res = await fetchSupplierNegotiations(accessToken);
        setData(res);
      } catch (e: any) {
        console.error(e);
        setErr(e?.message || "Failed to load negotiations");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [accessToken]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <div>
          <h1 className="text-xl font-semibold">
            Provider / Carrier Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Role: {user?.role ?? "unknown"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">{user?.email}</span>
          <button
            onClick={logout}
            className="text-xs px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <section className="bg-white rounded-2xl shadow p-4">
          <h2 className="text-lg font-semibold mb-1">Overview</h2>
          <p className="text-sm text-slate-600">
            View and manage negotiations with member collectives.
          </p>
          {data && (
            <div className="mt-3 grid gap-4 md:grid-cols-3 text-sm">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500">Open Negotiations</p>
                <p className="text-xl font-semibold">
                  {data.open_negotiations.length}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500">Closed Negotiations</p>
                <p className="text-xl font-semibold">
                  {data.closed_negotiations.length}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow p-4">
          <h3 className="text-md font-semibold mb-2">Open Negotiations</h3>
          {loading && <p className="text-sm text-slate-500">Loading…</p>}
          {err && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">
              {err}
            </p>
          )}
          {data && data.open_negotiations.length === 0 && !loading && (
            <p className="text-sm text-slate-500">No open negotiations yet.</p>
          )}
          {data && data.open_negotiations.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-slate-500">
                    <th className="py-2 pr-4">ID</th>
                    <th className="py-2 pr-4">Collective</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Target PMPM</th>
                    <th className="py-2 pr-4">Last Offer</th>
                    <th className="py-2 pr-4">Last Actor</th>
                    <th className="py-2 pr-4">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {data.open_negotiations.map((n) => (
                    <tr key={n.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{n.id}</td>
                      <td className="py-2 pr-4">{n.collective_id}</td>
                      <td className="py-2 pr-4 capitalize">{n.status}</td>
                      <td className="py-2 pr-4">
                        {n.target_pmpm != null ? `$${n.target_pmpm.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-2 pr-4">
                        {n.last_round_pmpm != null
                          ? `$${n.last_round_pmpm.toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="py-2 pr-4">
                        {n.last_round_actor ?? "—"}
                      </td>
                      <td className="py-2 pr-4 text-xs text-slate-500">
                        {new Date(n.updated_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow p-4">
          <h3 className="text-md font-semibold mb-2">Closed Negotiations</h3>
          {data && data.closed_negotiations.length === 0 ? (
            <p className="text-sm text-slate-500">None closed yet.</p>
          ) : (
            data &&
            data.closed_negotiations.length > 0 && (
              <ul className="space-y-2 text-sm">
                {data.closed_negotiations.map((n) => (
                  <li
                    key={n.id}
                    className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2"
                  >
                    <div>
                      <p className="font-medium">
                        Negotiation #{n.id} (Collective {n.collective_id})
                      </p>
                      <p className="text-xs text-slate-500">
                        Final PMPM:{" "}
                        {n.final_agreed_pmpm != null
                          ? `$${n.final_agreed_pmpm.toFixed(2)}`
                          : "—"}
                      </p>
                    </div>
                    <span className="text-xs rounded-full px-3 py-1 bg-emerald-50 text-emerald-700">
                      {n.status}
                    </span>
                  </li>
                ))}
              </ul>
            )
          )}
        </section>
      </main>
    </div>
  );
};

export default ProviderDashboard;

