import React from "react";
import { useAuth } from "../auth/AuthContext";

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <div>
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <p className="text-xs text-slate-500">Platform overview</p>
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
        <section className="grid gap-4 md:grid-cols-3">
          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="text-sm font-semibold mb-1">Members</h2>
            <p className="text-xs text-slate-600">
              Eventually: total members, growth, etc.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="text-sm font-semibold mb-1">Suppliers</h2>
            <p className="text-xs text-slate-600">
              Count of active providers/carriers and their activity.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="text-sm font-semibold mb-1">Negotiations</h2>
            <p className="text-xs text-slate-600">
              Active vs closed negotiations, average PMPM, etc.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
