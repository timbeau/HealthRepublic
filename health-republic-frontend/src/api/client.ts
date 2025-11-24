// src/api/client.ts

const BASE_URL = "http://198.58.119.187:8000";

// ---------- Types ----------

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface MeResponse {
  user: {
    id: number;
    email: string;
    full_name: string | null;
    role: string; // "member" | "supplier" | "admin"
  };
  sections: {
    headline: string;
    role: string;
  };
}

export interface Negotiation {
  id: number;
  status: string;
  target_pmpm: number | null;
  final_agreed_pmpm: number | null;
  final_expected_mlr: number | null;
  created_at: string;
  updated_at: string;
}

// Supplier dashboard types
export interface SupplierNegotiationSummary {
  id: number;
  collective_id: number;
  supplier_id: number;
  status: string;
  target_pmpm: number | null;
  final_agreed_pmpm: number | null;
  last_round_actor: string | null;
  last_round_pmpm: number | null;
  last_round_mlr: number | null;
  last_round_created_at: string | null;
  updated_at: string;
}

// Admin dashboard types
export interface AdminStats {
  total_users: number;
  members: number;
  suppliers: number;
  admins: number;

  total_negotiations: number;
  open_negotiations: number;
  in_progress_negotiations: number;
  agreed_negotiations: number;
}
// ---------- Public overview (splash page) ----------

export interface CollectiveSummary {
  id: number;
  name: string;
  category: string | null;
  member_count: number;
}

export interface PublicOverviewResponse {
  collectives: CollectiveSummary[];
  total_members: number;
  total_insurers: number;
  total_providers: number;
}

export interface AdminDashboardResponse {
  admin_id: number;
  email: string;
  stats: AdminStats;
}

export interface SupplierDashboardResponse {
  supplier_id: number;
  email: string;
  open_negotiations: SupplierNegotiationSummary[];
  closed_negotiations: SupplierNegotiationSummary[];
}
// src/api/client.ts

const BASE_URL = "http://198.58.119.187:8000";

// ---------- Types ----------

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface MeResponse {
  user: {
    id: number;
    email: string;
    full_name: string | null;
    role: string; // "member" | "supplier" | "admin"
  };
  sections: {
    headline: string;
    role: string;
  };
}

export interface Negotiation {
  id: number;
  status: string;
  target_pmpm: number | null;
  final_agreed_pmpm: number | null;
  final_expected_mlr: number | null;
  created_at: string;
  updated_at: string;
}

// Supplier dashboard types
export interface SupplierNegotiationSummary {
  id: number;
  collective_id: number;
  supplier_id: number;
  status: string;
  target_pmpm: number | null;
  final_agreed_pmpm: number | null;
  last_round_actor: string | null;
  last_round_pmpm: number | null;
  last_round_mlr: number | null;
  last_round_created_at: string | null;
  updated_at: string;
}

// Admin dashboard types
export interface AdminStats {
  total_users: number;
  members: number;
  suppliers: number;
  admins: number;

  total_negotiations: number;
  open_negotiations: number;
  in_progress_negotiations: number;
  agreed_negotiations: number;
}

// ---------- Public overview (splash page) ----------

export interface CollectiveSummary {
  id: number;
  name: string;
  category: string | null;
  member_count: number;
}

export interface PublicOverviewResponse {
  collectives: CollectiveSummary[];
  total_members: number;
  total_insurers: number;
  total_providers: number;
}

export interface AdminDashboardResponse {
  admin_id: number;
  email: string;
  stats: AdminStats;
}

export interface SupplierDashboardResponse {
  supplier_id: number;
  email: string;
  open_negotiations: SupplierNegotiationSummary[];
  closed_negotiations: SupplierNegotiationSummary[];
}

// Lookups + registration
export interface LookupsResponse {
  age_ranges: string[];
  industries: string[];
  roles: string[];
  user_types: string[];
}

export interface RegisterUserRequest {
  email: string;
  password: string;
  full_name?: string;
  state?: string;
  age_range?: string;
  industry?: string;
  household_size?: number;
  collective_id?: number;  // <-- NEW: used when coming from a specific collective
  role?: string;           // ignored by backend for public register
  user_type?: string;      // ignored by backend for public register
}

// ---------- Auth APIs ----------

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || "Login failed");
  }

  return JSON.parse(text) as LoginResponse;
}

export async function fetchMe(accessToken: string): Promise<MeResponse> {
  const res = await fetch(`${BASE_URL}/dashboard/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || "Failed to load profile");
  }

  return JSON.parse(text) as MeResponse;
}

// ---------- Member negotiations ----------

export async function fetchMemberNegotiations(
  accessToken: string
): Promise<Negotiation[]> {
  const url = `${BASE_URL}/negotiations/`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  });

  const bodyText = await res.text();

  if (!res.ok) {
    console.error(
      "Failed to load negotiations",
      res.status,
      res.statusText,
      bodyText
    );
    throw new Error(
      bodyText || `Failed to load negotiations (${res.status})`
    );
  }

  try {
    return JSON.parse(bodyText) as Negotiation[];
  } catch (e) {
    console.error("Failed to parse negotiations JSON", e, bodyText);
    throw new Error("Failed to parse negotiations data");
  }
}

// ---------- Admin dashboard ----------

export async function fetchAdminDashboard(
  accessToken: string
): Promise<AdminDashboardResponse> {
  const res = await fetch(`${BASE_URL}/dashboard/admin`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || "Failed to load admin dashboard");
  }

  return JSON.parse(text) as AdminDashboardResponse;
}

// ---------- Supplier dashboard ----------

export async function fetchSupplierNegotiations(
  accessToken: string
): Promise<SupplierDashboardResponse> {
  const res = await fetch(`${BASE_URL}/dashboard/supplier/negotiations`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || "Failed to load supplier negotiations");
  }

  return JSON.parse(text) as SupplierDashboardResponse;
}

// ---------- Lookups ----------

export async function fetchUserLookups(): Promise<LookupsResponse> {
  const res = await fetch(`${BASE_URL}/users/lookups`, {
    headers: {
      accept: "application/json",
    },
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || "Failed to load lookup values");
  }

  return JSON.parse(text) as LookupsResponse;
}

// ---------- Public overview fetch ----------

export async function fetchPublicOverview(): Promise<PublicOverviewResponse> {
  const res = await fetch(`${BASE_URL}/dashboard/public/overview`, {
    headers: {
      accept: "application/json",
    },
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || "Failed to load public overview");
  }

  return JSON.parse(text) as PublicOverviewResponse;
}

// ---------- Registration ----------

export async function registerUser(
  payload: RegisterUserRequest
): Promise<void> {
  const res = await fetch(`${BASE_URL}/users/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || "Registration failed");
  }
}

// ---------- Supplier registration ----------

export async function registerSupplierUser(
  payload: Omit<RegisterUserRequest, "role">
): Promise<void> {
  const res = await fetch(`${BASE_URL}/users/register-supplier`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || "Supplier registration failed");
  }
}

// Lookups + registration
export interface LookupsResponse {
  age_ranges: string[];
  industries: string[];
  roles: string[];
  user_types: string[];
}

export interface RegisterUserRequest {
  email: string;
  password: string;
  full_name?: string;
  state?: string;
  age_range?: string;
  industry?: string;
  household_size?: number;
  role?: string;      // will be ignored by backend for public register
  user_type?: string; // will be ignored by backend for public register
}

// ---------- Auth APIs ----------

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || "Login failed");
  }

  return JSON.parse(text) as LoginResponse;
}

export async function fetchMe(accessToken: string): Promise<MeResponse> {
  const res = await fetch(`${BASE_URL}/dashboard/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || "Failed to load profile");
  }

  return JSON.parse(text) as MeResponse;
}

// ---------- Member negotiations ----------

export async function fetchMemberNegotiations(
  accessToken: string
): Promise<Negotiation[]> {
  const url = `${BASE_URL}/negotiations/`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  });

  const bodyText = await res.text();

  if (!res.ok) {
    console.error(
      "Failed to load negotiations",
      res.status,
      res.statusText,
      bodyText
    );
    throw new Error(
      bodyText || `Failed to load negotiations (${res.status})`
    );
  }

  try {
    return JSON.parse(bodyText) as Negotiation[];
  } catch (e) {
    console.error("Failed to parse negotiations JSON", e, bodyText);
    throw new Error("Failed to parse negotiations data");
  }
}

// ---------- Admin dashboard ----------

export async function fetchAdminDashboard(
  accessToken: string
): Promise<AdminDashboardResponse> {
  const res = await fetch(`${BASE_URL}/dashboard/admin`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || "Failed to load admin dashboard");
  }

  return JSON.parse(text) as AdminDashboardResponse;
}

// ---------- Supplier dashboard ----------

export async function fetchSupplierNegotiations(
  accessToken: string
): Promise<SupplierDashboardResponse> {
  const res = await fetch(`${BASE_URL}/dashboard/supplier/negotiations`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || "Failed to load supplier negotiations");
  }

  return JSON.parse(text) as SupplierDashboardResponse;
}

// ---------- Lookups ----------

export async function fetchUserLookups(): Promise<LookupsResponse> {
  const res = await fetch(`${BASE_URL}/users/lookups`, {
    headers: {
      accept: "application/json",
    },
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || "Failed to load lookup values");
  }

  return JSON.parse(text) as LookupsResponse;
}

// ---------- Public overview fetch ----------

export async function fetchPublicOverview(): Promise<PublicOverviewResponse> {
  const res = await fetch(`${BASE_URL}/dashboard/public/overview`, {
    headers: {
      accept: "application/json",
    },
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || "Failed to load public overview");
  }

  return JSON.parse(text) as PublicOverviewResponse;
}

// ---------- Registration ----------

export async function registerUser(
  payload: RegisterUserRequest
): Promise<void> {
  const res = await fetch(`${BASE_URL}/users/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || "Registration failed");
  }
}
// ---------- Supplier registration ----------

export async function registerSupplierUser(
  payload: Omit<RegisterUserRequest, "role"> // backend will force role = supplier
): Promise<void> {
  const res = await fetch(`${BASE_URL}/users/register-supplier`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || "Supplier registration failed");
  }
}
