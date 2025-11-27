// src/pages/CollectivesAdminPage.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import type {
  CollectiveSummary,
  CreateCollectiveRequest,
} from "../api/client";
import {
  fetchCollectives,
  createCollective,
  updateCollective,
  deleteCollective,
} from "../api/client";

export default function CollectivesAdminPage() {
  const { user, accessToken } = useAuth();

  const [collectives, setCollectives] = useState<CollectiveSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Guard: only admins
  if (user && user.role !== "admin") {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Collectives admin</h1>
        <p className="text-sm text-red-600 mt-2">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

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

  function resetForm() {
    setFormMode("create");
    setEditingId(null);
    setName("");
    setCategory("");
  }

  function startEdit(c: CollectiveSummary) {
    setFormMode("edit");
    setEditingId(c.id);
    setName(c.name);
    setCategory(c.category || "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setSaving(true);
    setError(null);

    const payload: CreateCollectiveRequest = {
      name: name.trim(),
      category: category.trim() || null,
    };

    try {
      if (formMode === "create") {
        const created = await createCollective(accessToken, payload);
        setCollectives((prev) => [created, ...prev]);
      } else if (formMode === "edit" && editingId != null) {
        const updated = await updateCollective(accessToken, editingId, payload);
        setCollectives((prev) =>
          prev.map((c) => (c.id === editingId ? updated : c))
        );
      }
      resetForm();
    } catch (err: any) {
      console.error("Failed to save collective", err);
      setError(err.message || "Failed to save collective");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!accessToken) return;
    const ok = window.confirm("Delete this collective?");
    if (!ok) return;

    setDeleteError(null);

    try {
      await deleteCollective(accessToken, id);
      setCollectives((prev) => prev.filter((c) => c.id !== id));
      if (editingId === id) {
        resetForm();
      }
    } catch (err: any) {
      console.error("Failed to delete collective", err);
      setDeleteError(err.message || "Failed to delete collective");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Collectives Admin</h1>
          <p className="text-xs text-slate-500">
            Create, edit, and manage member collectives.
          </p>
        </div>
        {user && (
          <div className="text-xs text-slate-600">
            Signed in as <span className="font-medium">{user.email}</span>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 grid gap-6 md:grid-cols-[1.1fr_2fr]">
        {/* Form column */}
        <section className="bg-white rounded-2xl shadow p-4 space-y-3">
          <h2 className="text-sm font-semibold mb-1">
            {formMode === "create" ? "Create new collective" : "Edit collective"}
          </h2>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. Tech Workers Collective"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Category
              </label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. technology, education, small_business"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Used for grouping on the public splash page and member filters.
              </p>
            </div>

            {error && (
              <p className="text-xs text-red-600 whitespace-pre-line">
                {error}
              </p>
            )}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {saving
                  ? formMode === "create"
                    ? "Creating..."
                    : "Saving..."
                  : formMode === "create"
                  ? "Create collective"
                  : "Save changes"}
              </button>

              {formMode === "edit" && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-2 rounded-lg text-xs border text-slate-700 hover:bg-slate-50"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </section>

        {/* List column */}
        <section className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">All collectives</h2>
            {loading && (
              <span className="text-[11px] text-slate-500">Loading…</span>
            )}
          </div>

          {deleteError && (
            <p className="text-xs text-red-600 mb-2">{deleteError}</p>
          )}

          {!loading && collectives.length === 0 && (
            <p className="text-xs text-slate-500">
              No collectives yet. Use the form on the left to create one.
            </p>
          )}

          {collectives.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border px-2 py-1 text-left">ID</th>
                    <th className="border px-2 py-1 text-left">Name</th>
                    <th className="border px-2 py-1 text-left">Category</th>
                    <th className="border px-2 py-1 text-right">Members</th>
                    <th className="border px-2 py-1 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {collectives.map((c) => (
                    <tr key={c.id}>
                      <td className="border px-2 py-1">{c.id}</td>
                      <td className="border px-2 py-1">{c.name}</td>
                      <td className="border px-2 py-1">
                        {c.category || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="border px-2 py-1 text-right">
                        {typeof c.member_count === "number"
                          ? c.member_count
                          : "—"}
                      </td>
                      <td className="border px-2 py-1 text-center space-x-2">
                        <button
                          type="button"
                          onClick={() => startEdit(c)}
                          className="text-[11px] px-2 py-1 rounded border hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          className="text-[11px] px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
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
