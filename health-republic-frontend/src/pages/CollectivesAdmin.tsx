// src/pages/CollectivesAdmin.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import type { CollectiveSummary } from "../api/client";
import { fetchCollectives, createCollective } from "../api/client";

export default function CollectivesAdmin() {
  const { accessToken } = useAuth();

  const [collectives, setCollectives] = useState<CollectiveSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      setError("Missing access token");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchCollectives(accessToken)
      .then((data) => {
        if (cancelled) return;
        setCollectives(data);
      })
      .catch((err: any) => {
        if (cancelled) return;
        console.error("Failed to load collectives", err);
        setError(err.message || "Failed to load collectives");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;

    if (!name.trim()) {
      setCreateError("Name is required");
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const newCollective = await createCollective(accessToken, {
        name: name.trim(),
        category: category || undefined,
        description: description || undefined,
      });

      setCollectives((prev) => [newCollective, ...prev]);
      setName("");
      setCategory("");
      setDescription("");
    } catch (err: any) {
      console.error("Failed to create collective", err);
      setCreateError(err.message || "Failed to create collective");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <section className="bg-white rounded-2xl shadow p-5 border border-slate-200">
        <h2 className="text-sm font-semibold mb-1">
          Create a new collective
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Group members by industry, geography, employer, or affinity.
        </p>

        <form
          onSubmit={handleCreate}
          className="grid gap-3 md:grid-cols-2 text-sm"
        >
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Collective name *
            </label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. Austin Tech Workers, TX Employers 2–50"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Category
            </label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Industry, region, employer, etc."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Description
            </label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm min-h-[60px]"
              placeholder="Short description of who this collective is for and how it will negotiate."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {createError && (
            <div className="md:col-span-2 text-xs text-red-600">
              {createError}
            </div>
          )}

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create collective"}
            </button>
          </div>
        </form>
      </section>

      {/* List of collectives */}
      <section className="bg-white rounded-2xl shadow p-5 border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Existing collectives</h2>
          {loading && (
            <span className="text-[11px] text-slate-500">
              Loading…
            </span>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-600 mb-2">
            Error: {error}
          </p>
        )}

        {!loading && !error && collectives.length === 0 && (
          <p className="text-xs text-slate-500">
            No collectives created yet.
          </p>
        )}

        {!loading && collectives.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left border-b text-[11px] font-semibold text-slate-500">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left border-b text-[11px] font-semibold text-slate-500">
                    Category
                  </th>
                  <th className="px-3 py-2 text-left border-b text-[11px] font-semibold text-slate-500">
                    Members
                  </th>
                </tr>
              </thead>
              <tbody>
                {collectives.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className="px-3 py-2 border-b">
                      <div className="font-medium text-slate-800">
                        {c.name}
                      </div>
                    </td>
                    <td className="px-3 py-2 border-b text-slate-600">
                      {c.category || "—"}
                    </td>
                    <td className="px-3 py-2 border-b text-slate-800">
                      {c.member_count ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
