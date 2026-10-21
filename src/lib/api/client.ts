import { userTimeZone } from "@/lib/dates";
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
    .then((ok) => {
      // once per failed refresh cycle, however many requests were waiting on it
      if (!ok) onSessionExpired?.();
      return ok;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

// public account routes: a 401 here is never an expired session, so never trigger a refresh
const NO_RETRY = [
  "/auth/login",
  "/auth/drona",
  "/auth/refresh",
  "/auth/logout",
  "/auth/set-password",
  "/auth/forgot-password",
];

// `path` must start with "/" (no absolute URLs). `json` wins over `body`.
// A 401 retry re-sends `init`, so bodies must be replayable (string, FormData, Blob,
// URLSearchParams), never a stream.
export async function apiFetch(path: string, init: Init = {}, retried = false): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  // the server judges date rules ("not in the future") in the caller's own time zone
  headers.set("X-Timezone", userTimeZone());
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

// RFC 6266: prefer filename* (UTF-8, percent-encoded); a plain filename is used verbatim.
function filenameFrom(disposition: string): string | undefined {
  const star = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(disposition)?.[1];
  if (star) {
    try {
      return decodeURIComponent(star.trim());
    } catch {
      // malformed encoding: fall through to the plain filename
    }
  }
  const m = /filename\s*=\s*"([^"]*)"|filename\s*=\s*([^;]+)/i.exec(disposition);
  return (m?.[1] ?? m?.[2])?.trim() || undefined;
}

export async function apiDownload(
  path: string,
  fallbackName: string,
): Promise<{ total?: number; truncated: boolean }> {
  const res = await apiFetch(path);
  if (!res.ok) throw await toError(res);
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const name = filenameFrom(disposition);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: name ?? fallbackName,
  });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  const total = res.headers.get("X-Export-Total");
  const truncated = res.headers.get("X-Export-Truncated") === "true";
  return total ? { total: Number(total), truncated } : { truncated };
}
