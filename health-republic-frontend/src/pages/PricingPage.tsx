// src/pages/PricingPage.tsx
import { Link } from "react-router-dom";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-semibold text-slate-900">
              HR
            </div>
            <span className="text-sm font-semibold">Health Republic</span>
          </Link>

          <nav className="flex items-center gap-5 text-xs text-slate-300">
            <Link to="/how-it-works" className="hover:text-white">
              How it works
            </Link>
            <Link to="/collectives" className="hover:text-white">
              Collectives
            </Link>
            <Link to="/login" className="hover:text-white">
              Log in
            </Link>
            <Link
              to="/register"
              className="px-3 py-1.5 rounded-full bg-emerald-400 text-slate-950 font-medium hover:bg-emerald-300"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Pricing</h1>
          <p className="text-sm text-slate-300">
            Health Republic is designed to make group-level pricing accessible
            without surprise platform fees.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3 text-sm">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col">
            <h2 className="text-sm font-semibold mb-1">Members</h2>
            <p className="text-xs text-slate-300 mb-3">
              Individuals and families who join existing collectives.
            </p>
            <p className="text-lg font-semibold mb-1">Free</p>
            <p className="text-[11px] text-slate-400">
              No platform fee to join or browse collectives. You pay premiums
              and costs set by the chosen plan or provider.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col">
            <h2 className="text-sm font-semibold mb-1">Employers / Sponsors</h2>
            <p className="text-xs text-slate-300 mb-3">
              Organizations that create or sponsor collectives.
            </p>
            <p className="text-lg font-semibold mb-1">Pilot: $0</p>
            <p className="text-[11px] text-slate-400">
              During the pilot phase, there is no additional platform fee.
              Longer-term, we may introduce a small per-member administration
              fee for sponsors.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col">
            <h2 className="text-sm font-semibold mb-1">Suppliers</h2>
            <p className="text-xs text-slate-300 mb-3">
              Insurance suppliers and healthcare providers bidding on collectives.
            </p>
            <p className="text-lg font-semibold mb-1">Custom</p>
            <p className="text-[11px] text-slate-400">
              Supplier pricing can be based on volume, geography, and depth of
              integration. Contact us to discuss participation terms.
            </p>
          </div>
        </section>

        <section className="border border-slate-800 rounded-xl p-4 space-y-2 text-sm text-slate-200">
          <h2 className="text-sm font-semibold">No hidden platform margins</h2>
          <p className="text-slate-300">
            Health Republic is not a carrier. Our goal is to make pricing and
            negotiations transparent between collectives and suppliers, not to
            insert a new opaque middle layer.
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/register"
            className="px-4 py-2 rounded-full bg-emerald-400 text-slate-950 text-xs font-semibold hover:bg-emerald-300"
          >
            Get started
          </Link>
          <Link
            to="/how-it-works"
            className="px-4 py-2 rounded-full border border-slate-600 text-slate-100 text-xs hover:bg-slate-900"
          >
            Learn how it works
          </Link>
        </div>
      </main>
    </div>
  );
}
