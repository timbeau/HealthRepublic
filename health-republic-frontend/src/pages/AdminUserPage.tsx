import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  adminListUsers,
  adminCreateUser,
  adminDeactivateUser,
  adminActivateUser,
  type AdminUser
} from "../api/client";

export default function AdminUsersPage() {
  const { accessToken } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("member");

  function loadUsers() {
    if (!accessToken) return;
    adminListUsers(accessToken)
      .then((res) => setUsers(res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUsers();
  }, [accessToken]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adminCreateUser(accessToken!, {
        email: newEmail,
        password: newPassword,
        full_name: newFullName,
        role: newRole,
      });
      setShowCreate(false);
      setNewEmail("");
      setNewPassword("");
      setNewFullName("");
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">User Management</h1>

      <button
        onClick={() => setShowCreate(true)}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
      >
        Add User
      </button>

      {showCreate && (
        <form
          className="p-4 bg-white shadow rounded-lg space-y-4 max-w-md"
          onSubmit={handleCreateUser}
        >
          <h2 className="text-xl font-semibold">Create New User</h2>

          <input
            className="border p-2 w-full"
            placeholder="Email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
          <input
            className="border p-2 w-full"
            placeholder="Full Name"
            value={newFullName}
            onChange={(e) => setNewFullName(e.target.value)}
          />
          <input
            className="border p-2 w-full"
            type="password"
            placeholder="Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <select
            className="border p-2 w-full"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
          >
            <option value="member">Member</option>
            <option value="insurance_supplier">Insurance Supplier</option>
            <option value="healthcare_provider">Healthcare Provider</option>
            <option value="admin">Admin</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            Create
          </button>
        </form>
      )}

      {loading && <p>Loading users…</p>}
      {error && <p className="text-red-600">{error}</p>}

      <table className="min-w-full bg-white shadow rounded-lg text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Role</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.id}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.full_name}</td>
              <td className="p-2">{u.role}</td>

              <td className="p-2 text-right space-x-2">
                {u.role === "inactive" ? (
                  <button
                    className="px-3 py-1 bg-green-500 text-white rounded"
                    onClick={() => adminActivateUser(accessToken!, u.id).then(loadUsers)}
                  >
                    Activate
                  </button>
                ) : (
                  <button
                    className="px-3 py-1 bg-red-500 text-white rounded"
                    onClick={() => adminDeactivateUser(accessToken!, u.id).then(loadUsers)}
                  >
                    Deactivate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
