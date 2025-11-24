import React from "react";
import { useAuth } from "../auth/AuthContext";

const MemberDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <h1 className="text-xl font-semibold">Member Dashboard</h1>
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
          <h2 className="text-lg font-semibold mb-2">Your Collective</h2>
          <p className="text-sm text-slate-600">
            Here we’ll show the member’s active collective, current premium,
            and next steps (e.g. surveys, offers, etc.).
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-2xl shadow p-4">
            <h3 className="text-sm font-semibold mb-1">Active Offers</h3>
            <p className="text-xs text-slate-600">
              List of current bids/offers available to this member’s pool.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4">
            <h3 className="text-sm font-semibold mb-1">Surveys & Actions</h3>
            <p className="text-xs text-slate-600">
              Pending surveys or onboarding actions go here.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MemberDashboard;
