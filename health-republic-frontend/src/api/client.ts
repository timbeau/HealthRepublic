// src/api/client.ts

/* ============================================
   BASE URL
============================================ */
const BASE_URL = "http://198.58.119.187:8000";

/* ============================================
   TYPES
============================================ */

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
    role: string;
  };
  sections: {
    headline: string;
    role: string;
  };
  collective?: {
    id: number;
    name: string;
    category: string | null;
  } | null;
}

/* Negotiations */

export interface NegotiationRound {
  id: number;
  round_number: number;
  actor: "supplier" | "collective";
  proposed_pmpm: number | null;
  proposed_mlr: number | null;
  notes: string | null;
  created_at: string;
}

export interface Negotiation {
  id: number;
  status: string;
  target_pmpm: number | null;
  final_agreed_pmpm: number | null;
  final_expected_mlr: number | null;
  created_at: string;
  updated_at: string;
  risk_appetite?: number | null;
  rounds?: NegotiationRound[];
}

export interface NegotiationCreatePayload {
  collective_id: number;
  supplier_id: number;
  target_pmpm?: number | null;
  target_population_size?: number | null;
  risk_appetite?: number | null;
  target_start_date?: string | null; // ISO date string, e.g. "2025-01-01"
  notes?: string | null;
}

export interface OfferEvaluation {
  is_acceptable: boolean;
  message: string;
  difference_from_target?: number | null;
}

export interface OfferResponse {
  negotiation_id: number;
  status: string;
  round: NegotiationRound;
  evaluation: OfferEvaluation;
}

export interface OfferInput {
  proposed_pmpm: number;
  proposed_mlr?: number | null;
  notes?: string;
  accept?: boolean;
}

/* Supplier dashboard */
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

export interface SupplierDashboardResponse {
  supplier_id: number;
  email: string;
  open_negotiations: SupplierNegotiationSummary[];
  closed_negotiations: SupplierNegotiationSummary[];
}

/* Admin dashboard */
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

export interface AdminDashboardResponse {
  admin_id: number;
  email: string;
  stats: AdminStats;
}

/* Collectives */
export interface CollectiveSummary {
  id: number;
  name: string;
  category: string | null;
  member_count: number;
}

/* Public splash-page overview */
export interface PublicOverviewResponse {
  collectives: CollectiveSummary[];
  total_members: number;
  total_insurers: number;
  total_providers: number;
}

/* Lookups */
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
  role?: string;
  user_type?: string;
}

/* ============================================
   AUTH
============================================ */

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Login failed");
  return JSON.parse(text) as LoginResponse;
}

export async function fetchMe(accessToken: string) {
  const res = await fetch(`${BASE_URL}/dashboard/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to load profile");
  return JSON.parse(text) as MeResponse;
}

/* ============================================
   MEMBER NEGOTIATIONS
============================================ */

export async function fetchMemberNegotiations(accessToken: string) {
  // Member-scoped negotiations
  const res = await fetch(`${BASE_URL}/negotiations/my`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  });

  const body = await res.text();
  if (!res.ok) throw new Error(body || "Failed to load negotiations");
  return JSON.parse(body) as Negotiation[];
}

/* Detailed negotiation view (supplier portal / future coordinator UI) */

export async function fetchNegotiationDetail(
  accessToken: string,
  negotiationId: number
): Promise<Negotiation> {
  const res = await fetch(`${BASE_URL}/negotiations/${negotiationId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to load negotiation");
  return JSON.parse(text) as Negotiation;
}

export async function submitSupplierOffer(
  accessToken: string,
  negotiationId: number,
  payload: OfferInput
): Promise<OfferResponse> {
  const res = await fetch(
    `${BASE_URL}/negotiations/${negotiationId}/supplier-offer`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        ...payload,
        // For now suppliers never directly "accept"; collective/admin do that.
        accept: false,
      }),
    }
  );

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to submit offer");
  return JSON.parse(text) as OfferResponse;
}

/* ============================================
   NEGOTIATION CREATION (ADMIN)
============================================ */

export async function createNegotiation(
  accessToken: string,
  payload: NegotiationCreatePayload
) {
  const res = await fetch(`${BASE_URL}/negotiations/start`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to create negotiation");
  return JSON.parse(text) as Negotiation;
}

/* ============================================
   COLLECTIVES (PUBLIC + MEMBER JOIN/LEAVE)
============================================ */

export async function fetchCollectivesWithStats(): Promise<CollectiveSummary[]> {
  const res = await fetch(`${BASE_URL}/collectives/with-stats`, {
    headers: { accept: "application/json" },
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || "Failed to load collectives");
  }

  return JSON.parse(text) as CollectiveSummary[];
}

export async function joinCollective(
  accessToken: string,
  collectiveId: number
): Promise<any> {
  const res = await fetch(`${BASE_URL}/collectives/${collectiveId}/join`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || "Failed to join collective");
  }

  return text ? JSON.parse(text) : {};
}

export async function leaveCollective(
  accessToken: string,
  collectiveId: number
): Promise<any> {
  const res = await fetch(`${BASE_URL}/collectives/${collectiveId}/leave`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || "Failed to leave collective");
  }

  return text ? JSON.parse(text) : {};
}

/* ============================================
   ADMIN DASHBOARD
============================================ */

export async function fetchAdminDashboard(accessToken: string) {
  const res = await fetch(`${BASE_URL}/dashboard/admin`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to load admin dashboard");
  return JSON.parse(text) as AdminDashboardResponse;
}

/* ============================================
   SUPPLIER DASHBOARD
============================================ */

export async function fetchSupplierNegotiations(accessToken: string) {
  const res = await fetch(`${BASE_URL}/dashboard/supplier/negotiations`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to load supplier negotiations");
  return JSON.parse(text) as SupplierDashboardResponse;
}

/* ============================================
   LOOKUPS
============================================ */

export async function fetchUserLookups() {
  const res = await fetch(`${BASE_URL}/users/lookups`, {
    headers: { accept: "application/json" },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to load lookup values");
  return JSON.parse(text) as LookupsResponse;
}

/* ============================================
   PUBLIC OVERVIEW (SPLASH PAGE)
============================================ */

export async function fetchPublicOverview() {
  const res = await fetch(`${BASE_URL}/dashboard/public/overview`, {
    headers: { accept: "application/json" },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to load public overview");
  return JSON.parse(text) as PublicOverviewResponse;
}

/* ============================================
   REGISTRATION
============================================ */

export async function registerUser(payload: RegisterUserRequest) {
  const res = await fetch(`${BASE_URL}/users/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Registration failed");
}

export async function registerSupplierUser(
  payload: Omit<RegisterUserRequest, "role">
) {
  const res = await fetch(`${BASE_URL}/users/register-supplier`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Supplier registration failed");
}

/* ============================================
   COLLECTIVES (ADMIN)
============================================ */

export async function fetchCollectives(accessToken: string) {
  const res = await fetch(`${BASE_URL}/collectives/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to fetch collectives");
  return JSON.parse(text) as CollectiveSummary[];
}

export async function createCollective(
  accessToken: string,
  payload: { name: string; category?: string | null }
) {
  const res = await fetch(`${BASE_URL}/collectives/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to create collective");
}

export async function updateCollective(
  accessToken: string,
  collectiveId: number,
  payload: { name?: string; category?: string | null }
) {
  const res = await fetch(`${BASE_URL}/collectives/${collectiveId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to update collective");
}

export async function deleteCollective(
  accessToken: string,
  collectiveId: number
) {
  const res = await fetch(`${BASE_URL}/collectives/${collectiveId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to delete collective");
}
// ---------- Admin: User Management ----------

export interface AdminUser {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

export async function adminListUsers(accessToken: string): Promise<AdminUser[]> {
  const res = await fetch(`${BASE_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${accessToken}`, accept: "application/json" }
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return JSON.parse(text);
}

export async function adminCreateUser(accessToken: string, data: {
  email: string;
  password: string;
  full_name?: string;
  role: string;
}): Promise<AdminUser> {
  const res = await fetch(`${BASE_URL}/admin/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(data),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return JSON.parse(text);
}

export async function adminDeactivateUser(accessToken: string, userId: number) {
  const res = await fetch(`${BASE_URL}/admin/users/${userId}/deactivate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
}

export async function adminActivateUser(accessToken: string, userId: number) {
  const res = await fetch(`${BASE_URL}/admin/users/${userId}/activate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
}
// User list item
export interface UserAdminSummary {
  id: number;
  email: string;
  role: string;
  active: boolean;
}

// Fetch all users
export async function fetchAllUsers(accessToken: string) {
  const res = await fetch(`${BASE_URL}/admin/users/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to load users");

  return JSON.parse(text);
}


// Deactivate
export async function deactivateUser(accessToken: string, id: number) {
  const res = await fetch(`${BASE_URL}/users/admin/${id}/deactivate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) throw new Error(await res.text());
}

// Reactivate
export async function reactivateUser(accessToken: string, id: number) {
  const res = await fetch(`${BASE_URL}/users/admin/${id}/reactivate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) throw new Error(await res.text());
}
