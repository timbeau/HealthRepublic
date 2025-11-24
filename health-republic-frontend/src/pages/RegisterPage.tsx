// src/pages/RegisterPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  fetchUserLookups,
  registerUser,
  registerSupplierUser,
  type LookupsResponse,
  type RegisterUserRequest,
} from "../api/client";

type Mode = "member" | "employer" | "provider" | "insurer";

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- Read collective from query string ---
  const params = new URLSearchParams(location.search);
  const collectiveIdParam = params.get("collective_id");
  const collectiveNameParam = params.get("collective_name");

  const [collectiveId] = useState<number | null>(
    collectiveIdParam ? Number(collectiveIdParam) : null
  );
  const [collectiveName] = useState<string | null>(
    collectiveNameParam || null
  );

  // --- Lookup data ---
  const [lookups, setLookups] = useState<LookupsResponse | null>(null);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // --- Form state ---
  const [mode, setMode] = useState<Mode>("member");

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [state, setState] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [industry, setIndustry] = useState("");
  const [householdSize, setHouseholdSize] = useState<number | "">("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load lookup values from backend
  useEffect(() => {
    let cancelled = false;
    setLoadingLookups(true);
    setLookupError(null);

    fetchUserLookups()
      .then((data) => {
        if (cancelled) return;
        setLookups(data);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load lookups", err);
        setLookupError(err.message || "Failed to load lookup values");
      })
      .finally(() => {
        if (!cancelled) setLoadingLookups(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function validateForm(): string | null {
    if (!email.trim()) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(email)) return "Please enter a valid email address";

    if (!password) return "Password is required";
    if (password.length < 8)
      return "Password must be at least 8 characters long";

    if (password !== password2) return "Passwords do not match";

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const err = validateForm();
    if (err) {
      setFormError(err);
      return;
    }

    setSubmitting(true);

    const basePayload: RegisterUserRequest = {
      email,
      password,
      full_name: fullName || undefined,
      state: state || undefined,
      age_range: ageRange || undefined,
      industry: industry || undefined,
      household_size: householdSize === "" ? undefined : Number(householdSize),
      collective_id: collectiveId ?? undefined,
    };

    try {
      if (mode === "provider" || mode === "insurer") {
        // Supplier registration endpoint
        await registerSupplierUser(basePayload);
      } else {
        // Member / employer registration
        await registerUser(basePayload);
      }

      navigate("/login");
    } catch (err: any) {
      console.error("Registration failed", err);
      setFormError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-8 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-slate-900 flex items-center justify-center text-xs font-semibold text-white">
              HR
            </div>
            <div>
              <div className="text-sm font-semibold">Health Republic</div>
              <div className="text-xs text-slate-500">
                Join or supply a collective
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">
              Already have an account?
            </span>
            <Link
              to="/login"
              className="text-xs px-3 py-1.5 rounded-full border border-slate-300 hover:bg-slate-100"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* Collective banner if pre-selected */}
        {collectiveId && (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
            You&apos;re joining the{" "}
            <span className="font-semibold">
              {collectiveName || `Collective #${collectiveId}`}
            </span>{" "}
            inside Health Republic.
          </div>
        )}

        {/* Mode selector */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setMode("member")}
            className={`border rounded-xl p-3 text-left text-xs ${
              mode === "member"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 hover:border-slate-400"
            }`}
          >
            <div className="font-semibold mb-1">Individual Member</div>
            <p className={mode === "member" ? "text-slate-100" : "text-slate-500"}>
              Join a collective and access group-negotiated coverage.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMode("employer")}
            className={`border rounded-xl p-3 text-left text-xs ${
              mode === "employer"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 hover:border-slate-400"
            }`}
          >
            <div className="font-semibold mb-1">Employer / Sponsor</div>
            <p className={mode === "employer" ? "text-slate-100" : "text-slate-500"}>
              Create or join a collective for your workers or community.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMode("provider")}
            className={`border rounded-xl p-3 text-left text-xs ${
              mode === "provider"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 hover:border-slate-400"
            }`}
          >
            <div className="font-semibold mb-1">Healthcare Provider</div>
            <p className={mode === "provider" ? "text-slate-100" : "text-slate-500"}>
              Clinics, hospitals, and point-of-care providers.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMode("insurer")}
            className={`border rounded-xl p-3 text-left text-xs ${
              mode === "insurer"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 hover:border-slate-400"
            }`}
          >
            <div className="font-semibold mb-1">Insurance Supplier</div>
            <p className={mode === "insurer" ? "text-slate-100" : "text-slate-500"}>
              Carriers and TPAs offering products to collectives.
            </p>
          </button>
        </section>

        {lookupError && (
          <p className="text-xs text-red-600">
            Error loading lookup data: {lookupError}
          </p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium">Email *</label>
              <input
                type="email"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium">Full name</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium">Password *</label>
              <input
                type="password"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-xs font-medium">
                Confirm password *
              </label>
              <input
                type="password"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
                minLength={8}
              />
            </div>
          </div>

          {/* Demographics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium">State</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. WA, TX"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
              />
            </div>

            <div>
              <label className="block text-xs font-medium">Age range</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
                disabled={loadingLookups || !lookups}
              >
                <option value="">Select age range</option>
                {lookups?.age_ranges.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium">Industry</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                disabled={loadingLookups || !lookups}
              >
                <option value="">Select industry</option>
                {lookups?.industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium">
                Household size
              </label>
              <input
                type="number"
                min={1}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={householdSize}
                onChange={(e) =>
                  setHouseholdSize(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              />
            </div>
          </div>

          {formError && (
            <p className="text-xs text-red-600 mt-1">{formError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 bg-slate-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
