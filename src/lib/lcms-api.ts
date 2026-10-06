export type UserRole = "admin" | "legal_manager" | "legal_rep" | "requester" | "viewer";

export interface ApiErrorShape {
  error: { code: string; message: string; details?: Record<string, string> };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;
let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setSession(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
}

async function refreshSession() {
  if (!API_BASE_URL || !refreshToken) return false;
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) return false;
  const next = (await response.json()) as { accessToken: string; refreshToken?: string };
  accessToken = next.accessToken;
  refreshToken = next.refreshToken ?? refreshToken;
  return true;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  if (!API_BASE_URL) throw new Error("Demo mode is active because VITE_API_BASE_URL is not configured.");
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (response.status === 401 && retry && (await refreshSession())) return apiRequest(path, init, false);
  if (!response.ok) {
    const body = (await response.json().catch(() => ({ error: { code: "UNKNOWN", message: "The request could not be completed." } }))) as ApiErrorShape;
    throw body;
  }
  return response.json() as Promise<T>;
}

export async function logout() {
  if (API_BASE_URL && accessToken) await apiRequest("/auth/logout", { method: "POST" }).catch(() => undefined);
  accessToken = null;
  refreshToken = null;
}