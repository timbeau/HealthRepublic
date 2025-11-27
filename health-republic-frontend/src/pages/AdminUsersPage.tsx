import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  fetchAllUsers,
  deactivateUser,
  reactivateUser,
  type UserAdminSummary,
} from "../api/client";

export default function AdminUsersPage() {
  const { accessToken, user } = useAuth();

  const [users, setUsers] = useState<UserAdminSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!accessToken) {
      setError("Missing access token");
      setLoading(false);
      return;
    }

    fetchAllUsers(accessToken)
      .then((data) => {
        setUsers(data);
      })
      .catch((err: any) => {
        console.error(err);
        setError(err.message || "Failed to load users");
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  const handleDeactivate = async (id: number) => {
    if (!accessToken) return;
    try {
      await deactivateUser(accessToken, id);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, active: false } : u))
      );
    } catch (err: any) {
      alert("Failed to deactivate user: " + err.message);
    }
  };

  const handleReactivate = async (id: number) => {
    if (!accessToken) return;
    try {
      await reactivateUser(accessToken, id);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, active: true } : u))
      );
    } catch (err: any) {
      alert("Failed to reactivate user: " + err.message);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (!user || user.role !== "admin") {
    return <div className="p-6 text-red-600">Access denied.</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-4">User Management</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search users by email..."
          className="w-full border rounded-lg px-3 py-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <p>Loading users…</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="space-y-3 mt-4">
        {filteredUsers.map((u) => (
          <div
            key={u.id}
            className="p-4 bg-white shadow rounded-lg flex items-center justify-between"
          >
            <div>
              <div className="font-semibold">{u.email}</div>
              <div className="text-xs text-gray-500">
                Role: {u.role} — Status: {u.active ? "Active" : "Inactive"}
              </div>
            </div>

            <div className="space-x-2">
              {u.active ? (
                <button
                  onClick={() => handleDeactivate(u.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm"
                >
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => handleReactivate(u.id)}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm"
                >
                  Reactivate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
