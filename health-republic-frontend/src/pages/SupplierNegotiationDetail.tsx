import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { fetchNegotiationDetail, submitSupplierOffer } from "../api/client";
import type { Negotiation, OfferEvaluation } from "../api/client";

export default function SupplierNegotiationDetail() {
  const { id } = useParams<{ id: string }>();
  const negotiationId = Number(id);
  const { user, accessToken, logout } = useAuth();

  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [proposedPmpm, setProposedPmpm] = useState<string>("");
  const [proposedMlr, setProposedMlr] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [lastEvaluation, setLastEvaluation] = useState<OfferEvaluation | null>(
    null
  );

  // Load + poll for "real-time" updates
  useEffect(() => {
    if (!accessToken || !negotiationId) return;

    let cancelled = false;
    let intervalId: number | undefined;

    const load = async () => {
      try {
        const data = await fetchNegotiationDetail(accessToken, negotiationId);
        if (!cancelled) {
          setNegotiation(data);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("Failed to load negotiation", err);
          setError(err.message || "Failed to load negotiation");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    intervalId = window.setInterval(load, 10000); // 10s polling

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [accessToken, negotiationId]);

  if (!user) {
    return <div className="p-6 text-sm text-slate-700">Not logged in.</div>;
  }

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !negotiationId) return;

    const pmpm = Number(proposedPmpm);
    const mlr = proposedMlr.trim() ? Number(proposedMlr) : undefined;
    if (Number.isNaN(pmpm)) {
      setError("Please enter a valid PMPM amount.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await submitSupplierOffer(accessToken, negotiationId, {
        proposed_pmpm: pmpm,
        proposed_mlr: mlr,
        notes: notes.trim() || undefined,
      });
      setLastEvaluation(res.evaluation);

      // Refresh negotiation detail so timeline updates immediately
      const updated = await fetchNegotiationDetail(accessToken, negotiationId);
      setNegotiation(updated);

      // Clear form
      setProposedPmpm("");
      setProposedMlr("");
      setNotes("");
    } catch (err: any) {
      console.error("Failed to submit offer", err);
      setError(err.message || "Failed to submit offer");
    } finally {
      setSubmitting(false);
    }
  };

  const rounds = [...(negotiation?.rounds ?? [])].sort(
    (a, b) => a.round_number - b.round_number
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <div>
          <h1 className="text-xl font-semibold">Negotiation #{negotiationId}</h1>
          <p className="text-xs text-slate-500">
            Supplier-side live view and offer entry
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

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Back link */}
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="text-xs px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            ← Back to supplier dashboard
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="text-xs px-3 py-1 rounded-full bg-white border border-slate-200 hover:bg-slate-50"
          >
            Refresh now
          </button>
        </div>

        {/* Status summary */}
        <section className="bg-white rounded-2xl shadow p-4">
          {loading && (
            <p className="text-xs text-slate-500">Loading negotiation…</p>
          )}
          {error && (
            <p className="text-xs text-red-600 break-all mb-2">Error: {error}</p>
          )}
          {negotiation && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="text-slate-500">Status</div>
                <div className="text-sm font-semibold capitalize">
                  {negotiation.status}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Target PMPM</div>
                <div className="text-sm font-semibold">
                  {negotiation.target_pmpm ?? "-"}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Final agreed PMPM</div>
                <div className="text-sm font-semibold">
                  {negotiation.final_agreed_pmpm ?? "-"}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Final expected MLR</div>
                <div className="text-sm font-semibold">
                  {negotiation.final_expected_mlr ?? "-"}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Timeline */}
        <section className="bg-white rounded-2xl shadow p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Negotiation timeline
          </h2>
          {rounds.length === 0 && (
            <p className="text-xs text-slate-500">
              No rounds yet. Start the negotiation by making an offer.
            </p>
          )}
          {rounds.length > 0 && (
            <ol className="space-y-3 text-xs">
              {rounds.map((r) => (
                <li
                  key={r.id}
                  className="border border-slate-200 rounded-xl p-3 flex justify-between items-start"
                >
                  <div>
                    <div className="font-semibold capitalize">
                      {r.actor} offer
                    </div>
                    <div className="mt-1 text-slate-600">
                      <span className="font-medium">PMPM:</span>{" "}
                      {r.proposed_pmpm ?? "-"}
                      {" · "}
                      <span className="font-medium">MLR:</span>{" "}
                      {r.proposed_mlr ?? "-"}
                    </div>
                    {r.notes && (
                      <div className="mt-1 text-slate-500">“{r.notes}”</div>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 text-right">
                    <div>Round {r.round_number}</div>
                    <div>
                      {new Date(r.created_at).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Last evaluation (from your most recent offer) */}
        {lastEvaluation && (
          <section className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900">
            <div className="font-semibold mb-1">Offer evaluation</div>
            <p className="mb-1">{lastEvaluation.message}</p>
            {typeof lastEvaluation.difference_from_target === "number" && (
              <p className="text-emerald-800">
                Difference from target: {lastEvaluation.difference_from_target}
              </p>
            )}
          </section>
        )}

        {/* Offer form */}
        <section className="bg-white rounded-2xl shadow p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Submit supplier offer
          </h2>
          <form onSubmit={handleSubmitOffer} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-slate-600">
                  Proposed PMPM
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={proposedPmpm}
                  onChange={(e) => setProposedPmpm(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-slate-600">
                  Proposed MLR (optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={proposedMlr}
                  onChange={(e) => setProposedMlr(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-slate-600">
                Notes (optional)
              </label>
              <textarea
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any context about this offer (population, risk, etc.)"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-500">
                This will create a new round in the negotiation timeline.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="text-xs px-4 py-1.5 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 disabled:bg-slate-300"
              >
                {submitting ? "Submitting…" : "Submit offer"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
