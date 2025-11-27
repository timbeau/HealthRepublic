// src/pages/SupplierRegisterPage.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerSupplierUser } from "../api/client";

export default function SupplierRegisterPage() {
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [supplierType, setSupplierType] = useState("insurance_supplier"); // default
  const [industry, setIndustry] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validateForm(): string | null {
    if (!email.trim()) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(email)) return "Enter a valid email address";

    if (!password) return "Password is required";
    if (password.length < 8)
      return "Password must be at least 8 characters long";

    if (password !== password2) return "Passwords do not match";

    if (!companyName) return "Company name is required";

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const msg = validateForm();
    if (msg) {
      setError(msg);
      return;
    }

    setSubmitting(true);

    try {
      await registerSupplierUser({
        email,
        password,
        full_name: fullName || undefined,
        industry: supplierType, // maps to RoleEnum: insurance_supplier / healthcare_provider
        state: undefined,
        age_range: undefined,
        household_size: undefined,
      });

      navigate("/login");
    } catch (err: any) {
      console.error("Supplier registration failed", err);
      setError(err.message || "Supplier registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow p-6 space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-bold">Register as a Supplier</h1>
          <p className="text-sm text-slate-600 mt-1">
            Create an account as an insurance carrier or healthcare provider.
          </p>
        </header>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Supplier Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Supplier Type *
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={supplierType}
              onChange={(e) => setSupplierType(e.target.value)}
            >
              <option value="insurance_supplier">Insurance Supplier</option>
              <option value="healthcare_provider">Healthcare Provider</option>
            </select>
          </div>

          {/* Company name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Company / Organization Name *
            </label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>

          {/* Identity */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Your Email *</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label className="block text-sm font-medium mt-2">Full Name</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Password *</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />

            <label className="block text-sm font-medium mt-2">
              Confirm Password *
            </label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              minLength={8}
              required
            />
          </div>

          {/* Error display */}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting
              ? "Creating Account…"
              : "Create Supplier Account"}
          </button>
        </form>

        <p className="text-xs text-slate-600 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-700 underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
