import { ApiError, type ApiErrorBody } from "./errors";

const BASE = ((import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "").replace(
  /\/$/,
  "",
);

type Init = Omit<RequestInit, "body"> & { json?: unknown; body?: BodyInit | null };

let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(fn: (() => void) | null) {
  onSessionExpired = fn;
}

let refreshing: Promise<boolean> | null = null;
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

const NO_RETRY = ["/auth/login", "/auth/refresh", "/auth/logout"];

export async function apiFetch(path: string, init: Init = {}, retried = false): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  let body: BodyInit | null | undefined = init.body;
  if (init.json !== undefined) {
    body = JSON.stringify(init.json);
  }
  if (body === undefined && method !== "GET" && method !== "HEAD") {
    body = "{}";
  }
  if (typeof body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const { json: _json, body: _body, ...rest } = init;
  void _json;
  void _body;
  const req: RequestInit = { ...rest, method, headers, credentials: "include" };
  if (body !== undefined) req.body = body;
  const res = await fetch(`${BASE}${path}`, req);
  if (res.status === 401 && !retried && !NO_RETRY.some((p) => path.startsWith(p))) {
    if (await refreshSession()) return apiFetch(path, init, true);
    onSessionExpired?.();
  }
  return res;
}

async function toError(res: Response): Promise<ApiError> {
  const b = (await res.json().catch(() => null)) as Partial<ApiErrorBody> | null;
  const e = b && typeof b === "object" ? b.error : undefined;
  return new ApiError(
    res.status,
    typeof e?.code === "string" ? e.code : "UNKNOWN",
    typeof e?.message === "string" ? e.message : "The request could not be completed.",
    e?.details && typeof e.details === "object" ? e.details : undefined,
  );
}

export async function apiJson<T>(path: string, init: Init = {}): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) throw await toError(res);
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export async function apiDownload(
  path: string,
  fallbackName: string,
): Promise<{ total?: number; truncated: boolean }> {
  const res = await apiFetch(path);
  if (!res.ok) throw await toError(res);
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const name = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)?.[1];
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: name ? decodeURIComponent(name) : fallbackName,
  });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  const total = res.headers.get("X-Export-Total");
  const truncated = res.headers.get("X-Export-Truncated") === "true";
  return total ? { total: Number(total), truncated } : { truncated };
}
