// src/pages/AdminDashboard.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  fetchAdminDashboard,
  createNegotiation,
} from "../api/client";
import type {
  AdminDashboardResponse,
  NegotiationCreatePayload,
  Negotiation,
} from "../api/client";

export default function AdminDashboard() {
  const { accessToken, user } = useAuth();

  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdNegotiation, setCreatedNegotiation] = useState<Negotiation | null>(
    null
  );

  // Form state
  const [form, setForm] = useState({
    collective_id: "",
    supplier_id: "",
    target_pmpm: "",
    target_population_size: "",
    risk_appetite: "",
    target_start_date: "",
    notes: "",
  });

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      setError("Missing access token");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchAdminDashboard(accessToken)
      .then((data) => {
        if (cancelled) return;
        setDashboard(data);
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
  }, [accessToken]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setCreateError("Missing access token");
      return;
    }

    setCreating(true);
    setCreateError(null);
    setCreatedNegotiation(null);

    const payload: NegotiationCreatePayload = {
      collective_id: Number(form.collective_id),
      supplier_id: Number(form.supplier_id),
      target_pmpm: form.target_pmpm ? Number(form.target_pmpm) : null,
      target_population_size: form.target_population_size
        ? Number(form.target_population_size)
        : null,
      risk_appetite: form.risk_appetite ? Number(form.risk_appetite) : null,
      target_start_date: form.target_start_date || null,
      notes: form.notes || null,
    };

    if (Number.isNaN(payload.collective_id) || Number.isNaN(payload.supplier_id)) {
      setCreateError("Collective ID and Supplier ID must be valid numbers.");
      setCreating(false);
      return;
    }

    try {
      const created = await createNegotiation(accessToken, payload);
      setCreatedNegotiation(created);

      setForm((prev) => ({
        ...prev,
        target_pmpm: "",
        target_population_size: "",
        risk_appetite: "",
        target_start_date: "",
        notes: "",
      }));
    } catch (err: any) {
      console.error("Failed to create negotiation", err);
      setCreateError(err.message || "Failed to create negotiation");
    } finally {
      setCreating(false);
    }
  };

  const hasStats = !!dashboard?.stats;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Admin Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            System overview and negotiation management
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/app/admin/users"
            className="inline-flex items-center rounded-full bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700"
          >
            Manage Users
          </Link>
          {user && (
            <div className="text-right">
              <div className="text-sm font-medium">
                {user.full_name || user.email}
              </div>
              <div className="text-xs text-slate-500">Role: {user.role}</div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-8">
        {/* Overview stats */}
        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Platform Overview
          </h2>

          {loading && (
            <p className="text-sm text-slate-500">Loading admin dashboard…</p>
          )}

          {error && (
            <p className="text-sm text-red-600 break-all">Error: {error}</p>
          )}

          {hasStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl shadow p-4">
                <div className="text-xs text-slate-500">Total users</div>
                <div className="mt-1 text-2xl font-semibold">
                  {dashboard!.stats.total_users}
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow p-4">
                <div className="text-xs text-slate-500">Members</div>
                <div className="mt-1 text-2xl font-semibold">
                  {dashboard!.stats.members}
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow p-4">
                <div className="text-xs text-slate-500">Suppliers</div>
                <div className="mt-1 text-2xl font-semibold">
                  {dashboard!.stats.suppliers}
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow p-4">
                <div className="text-xs text-slate-500">Admins</div>
                <div className="mt-1 text-2xl font-semibold">
                  {dashboard!.stats.admins}
                </div>
              </div>
            </div>
          )}

          {!loading && !error && !hasStats && (
            <p className="text-xs text-slate-500">
              No stats payload returned from <code>/dashboard/admin</code>.
            </p>
          )}
        </section>

        {/* Negotiation stats */}
        {hasStats && (
          <section>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              Negotiations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl shadow p-4">
                <div className="text-xs text-slate-500">Total</div>
                <div className="mt-1 text-2xl font-semibold">
                  {dashboard!.stats.total_negotiations}
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow p-4">
                <div className="text-xs text-slate-500">Open</div>
                <div className="mt-1 text-2xl font-semibold">
                  {dashboard!.stats.open_negotiations}
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow p-4">
                <div className="text-xs text-slate-500">In progress</div>
                <div className="mt-1 text-2xl font-semibold">
                  {dashboard!.stats.in_progress_negotiations}
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow p-4">
                <div className="text-xs text-slate-500">Agreed</div>
                <div className="mt-1 text-2xl font-semibold">
                  {dashboard!.stats.agreed_negotiations}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* New Negotiation Form */}
        <section className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">
              Start New Negotiation
            </h2>
            {creating && (
              <span className="text-xs text-slate-500">
                Creating negotiation…
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 mb-4">
            Provide the collective and supplier IDs, then set your target PMPM,
            population, and risk appetite. This will create a new negotiation
            that appears in both the member (collective) view and supplier
            portal.
          </p>

          {createError && (
            <p className="text-xs text-red-600 mb-3 break-all">
              Error: {createError}
            </p>
          )}

          {createdNegotiation && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              Created negotiation #{createdNegotiation.id} (status:{" "}
              <span className="font-semibold">
                {createdNegotiation.status}
              </span>
              )
            </div>
          )}

          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            onSubmit={handleCreate}
          >
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Collective ID
              </label>
              <input
                type="number"
                name="collective_id"
                value={form.collective_id}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Supplier ID
              </label>
              <input
                type="number"
                name="supplier_id"
                value={form.supplier_id}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target PMPM
              </label>
              <input
                type="number"
                step="0.01"
                name="target_pmpm"
                value={form.target_pmpm}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g. 420.00"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target population size
              </label>
              <input
                type="number"
                name="target_population_size"
                value={form.target_population_size}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g. 1000"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Risk appetite (0–1 or 0–100)
              </label>
              <input
                type="number"
                step="0.01"
                name="risk_appetite"
                value={form.risk_appetite}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g. 0.8 or 80"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target start date
              </label>
              <input
                type="date"
                name="target_start_date"
                value={form.target_start_date}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Optional context for this negotiation..."
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {creating ? "Creating…" : "Start negotiation"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
