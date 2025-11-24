// src/pages/HowItWorksPage.tsx
import { Link } from "react-router-dom";

export default function HowItWorksPage() {
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
            <Link to="/collectives" className="hover:text-white">
              Collectives
            </Link>
            <Link to="/pricing" className="hover:text-white">
              Pricing
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
          <h1 className="text-2xl font-semibold">How Health Republic works</h1>
          <p className="text-sm text-slate-300">
            We turn scattered individuals and small groups into powerful
            purchasing collectives and invite insurers and healthcare
            providers to bid for their business.
          </p>
        </header>

        <section className="space-y-4 text-sm text-slate-200">
          <div>
            <h2 className="text-sm font-semibold mb-1">
              1. People join or create a collective
            </h2>
            <p className="text-slate-300">
              Members, employers, and community sponsors join an existing
              collective or create a new one around a theme: freelancers in
              a state, workers in a sector, retirees, etc.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-1">
              2. Suppliers submit bids
            </h2>
            <p className="text-slate-300">
              Insurance suppliers and point-of-care providers see anonymized
              profiles (age ranges, locations, group size) and submit offers
              for PMPM pricing, benefit richness, and network coverage.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-1">
              3. The collective negotiates
            </h2>
            <p className="text-slate-300">
              The collective can counter, compare options, and align on a
              preferred deal. All negotiation history is visible inside the
              member and supplier portals.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-1">
              4. Members enroll with the chosen supplier(s)
            </h2>
            <p className="text-slate-300">
              Once the collective approves a deal, members can enroll with
              clear expectations of cost, coverage, and provider networks.
            </p>
          </div>
        </section>

        <section className="border border-slate-800 rounded-xl p-4 space-y-2">
          <h2 className="text-sm font-semibold">Who is Health Republic for?</h2>
          <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
            <li>Individuals and families who want group-level pricing.</li>
            <li>Small employers and associations without traditional scale.</li>
            <li>Insurers looking for curated, ready-to-buy groups.</li>
            <li>Healthcare providers who want direct relationships with collectives.</li>
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/register"
            className="px-4 py-2 rounded-full bg-emerald-400 text-slate-950 text-xs font-semibold hover:bg-emerald-300"
          >
            Get started
          </Link>
          <Link
            to="/collectives"
            className="px-4 py-2 rounded-full border border-slate-600 text-slate-100 text-xs hover:bg-slate-900"
          >
            Browse collectives
          </Link>
        </div>
      </main>
    </div>
  );
}
