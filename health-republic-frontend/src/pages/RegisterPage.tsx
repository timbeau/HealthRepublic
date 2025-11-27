// src/pages/RegisterPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchUserLookups,
  registerUser,
  registerSupplierUser,
} from "../api/client";
import type { LookupsResponse } from "../api/client";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [lookups, setLookups] = useState<LookupsResponse | null>(null);
  const [loadingLookups, setLoadingLookups] = useState(true);

  const [category, setCategory] = useState<
    "member" | "employer" | "provider" | "insurer"
  >("member");

  // Form fields
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [state, setState] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [industry, setIndustry] = useState("");
  const [householdSize, setHouseholdSize] = useState<number | "">("");

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* ------------------------
     Load lookup values
  -------------------------*/
  useEffect(() => {
    fetchUserLookups()
      .then((res) => setLookups(res))
      .catch((err) => setFormError(err.message))
      .finally(() => setLoadingLookups(false));
  }, []);

  /* ------------------------
     Validation
  -------------------------*/
  function validate(): string | null {
    if (!email.trim()) return "Email is required.";
    if (!password.trim()) return "Password is required.";
    if (password !== password2) return "Passwords do not match.";
    return null;
  }

  /* ------------------------
     Submit
  -------------------------*/
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const error = validate();
    if (error) return setFormError(error);

    setSubmitting(true);

    try {
      if (category === "provider" || category === "insurer") {
        await registerSupplierUser({
          email,
          password,
          full_name: fullName || undefined,
          industry: industry || undefined,
          state: state || undefined,
        });
      } else {
        await registerUser({
          email,
          password,
          full_name: fullName || undefined,
          age_range: ageRange || undefined,
          industry: industry || undefined,
          household_size:
            householdSize === "" ? undefined : Number(householdSize),
          state: state || undefined,
        });
      }

      navigate("/login");
    } catch (err: any) {
      setFormError(err.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ============================================================
     🎨 UI: Beautiful Apple-Inspired Registration Layout
     ============================================================*/
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-100 flex flex-col items-center">
      {/* Nav */}
      <div className="w-full max-w-6xl flex justify-between items-center py-6 px-4">
        <Link to="/" className="text-2xl font-semibold tracking-tight">
          Health Republic
        </Link>

        <Link to="/login" className="text-sm text-slate-600 hover:text-black">
          Log in
        </Link>
      </div>

      {/* Content */}
      <div className="w-full max-w-3xl mx-auto px-6 mt-4 pb-20">

        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Create your account
        </h1>
        <p className="text-slate-600 mb-10">
          Join the Health Republic ecosystem.
        </p>

        {/* --------- CATEGORY SELECTOR --------- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <CategoryCard
            title="Individual Member"
            desc="Join a collective and access group-negotiated coverage."
            selected={category === "member"}
            onClick={() => setCategory("member")}
          />
          <CategoryCard
            title="Employer / Sponsor"
            desc="Create or join a collective for your workers or community."
            selected={category === "employer"}
            onClick={() => setCategory("employer")}
          />
          <CategoryCard
            title="Healthcare Provider"
            desc="Clinics, hospitals, and point-of-care providers."
            selected={category === "provider"}
            onClick={() => setCategory("provider")}
          />
          <CategoryCard
            title="Insurance Supplier"
            desc="Carriers and TPAs offering products to collectives."
            selected={category === "insurer"}
            onClick={() => setCategory("insurer")}
          />
        </div>

        {/* --------- FORM --------- */}
        <div className="bg-white shadow-xl rounded-3xl p-8 border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* email */}
            <Input label="Email *" value={email} onChange={setEmail} required />

            {/* name */}
            <Input
              label="Full name"
              value={fullName}
              onChange={setFullName}
            />

            {/* passwords */}
            <Input
              type="password"
              label="Password *"
              value={password}
              onChange={setPassword}
            />
            <Input
              type="password"
              label="Confirm password *"
              value={password2}
              onChange={setPassword2}
            />

            {/* Shared: state */}
            <Input
              label="State (e.g. TX)"
              value={state}
              onChange={(v) => setState(v.toUpperCase())}
            />

            {/* Member/employer fields */}
            {(category === "member" || category === "employer") && (
              <>
                <Select
                  label="Age range"
                  value={ageRange}
                  onChange={setAgeRange}
                  options={lookups?.age_ranges || []}
                />
                <Select
                  label="Industry"
                  value={industry}
                  onChange={setIndustry}
                  options={lookups?.industries || []}
                />
                <Input
                  type="number"
                  label="Household size"
                  value={householdSize}
                  onChange={(v) =>
                    setHouseholdSize(v === "" ? "" : Number(v))
                  }
                />
              </>
            )}

            {/* Provider / Insurer fields */}
            {(category === "provider" || category === "insurer") && (
              <Select
                label="Industry"
                value={industry}
                onChange={setIndustry}
                options={lookups?.industries || []}
              />
            )}

            {/* Error */}
            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-black text-white py-3 rounded-xl text-sm font-medium hover:bg-slate-900 disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create account"}
            </button>
          </form>

          <p className="text-xs text-center text-slate-600 mt-6">
            Already have an account?{" "}
            <Link className="underline" to="/login">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* =================================================================
   COMPONENTS
   ================================================================= */

function CategoryCard({
  title,
  desc,
  selected,
  onClick,
}: {
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-5 rounded-2xl text-left border transition shadow-sm
      ${
        selected
          ? "bg-black text-white border-black"
          : "bg-white text-slate-900 border-slate-300 hover:border-black"
      }`}
    >
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-slate-500 mt-1">{desc}</p>
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-black focus:border-black"
      >
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
