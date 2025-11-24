// src/pages/AdminDashboard.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import type { AdminDashboardResponse } from "../api/client";
import { fetchAdminDashboard } from "../api/client";

export default function AdminDashboard() {
  const { user, accessToken, logout } = useAuth();

  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      setError("No access token");
      return;
    }
    if (!user || user.role !== "admin") {
      setLoading(false);
      setError("You must be an admin to view this dashboard.");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchAdminDashboard(accessToken)
      .then((res) => {
        if (cancelled) return;
        setData(res);
      })
      .catch((err: any) => {
        if (cancelled) return;
        console.error("Failed to load admin dashboard", err);
        setError(err.message || "Failed to load admin dashboard");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, user]);

  if (!user) {
    return <div className="p-6">Not logged in.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <div>
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <p className="text-xs text-slate-500">
            Platform overview for Health Republic
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">
            {user.email} &middot; {user.role}
          </span>
          <button
            onClick={logout}
            className="text-xs px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {loading && <p className="text-sm text-slate-500">Loading stats…</p>}

        {error && (
          <p className="text-sm text-red-600">
            Error: {error}
          </p>
        )}

        {data && (
          <>
            {/* User stats */}
            <section className="grid gap-4 md:grid-cols-4">
              <div className="bg-white rounded-2xl shadow p-4">
                <h2 className="text-xs font-semibold text-slate-500">
                  Total users
                </h2>
                <p className="text-2xl font-bold mt-1">
                  {data.stats.total_users}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow p-4">
                <h2 className="text-xs font-semibold text-slate-500">
                  Members
                </h2>
                <p className="text-2xl font-bold mt-1">
                  {data.stats.members}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow p-4">
                <h2 className="text-xs font-semibold text-slate-500">
                  Suppliers
                </h2>
                <p className="text-2xl font-bold mt-1">
                  {data.stats.suppliers}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow p-4">
                <h2 className="text-xs font-semibold text-slate-500">
                  Admins
                </h2>
                <p className="text-2xl font-bold mt-1">
                  {data.stats.admins}
                </p>
              </div>
            </section>

            {/* Negotiation stats */}
            <section className="grid gap-4 md:grid-cols-4">
              <div className="bg-white rounded-2xl shadow p-4">
                <h2 className="text-xs font-semibold text-slate-500">
                  Total negotiations
                </h2>
                <p className="text-2xl font-bold mt-1">
                  {data.stats.total_negotiations}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow p-4">
                <h2 className="text-xs font-semibold text-slate-500">
                  Open
                </h2>
                <p className="text-2xl font-bold mt-1">
                  {data.stats.open_negotiations}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow p-4">
                <h2 className="text-xs font-semibold text-slate-500">
                  In progress
                </h2>
                <p className="text-2xl font-bold mt-1">
                  {data.stats.in_progress_negotiations}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow p-4">
                <h2 className="text-xs font-semibold text-slate-500">
                  Agreed
                </h2>
                <p className="text-2xl font-bold mt-1">
                  {data.stats.agreed_negotiations}
                </p>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
