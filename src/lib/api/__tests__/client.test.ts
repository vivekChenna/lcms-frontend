import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiDownload, apiFetch, apiJson, setSessionExpiredHandler } from "../client";
import { ApiError, fieldErrors } from "../errors";

const fetchMock = vi.fn();
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const strip = (u: string) => new URL(u, "http://x").pathname;
const calls = (path: string) => fetchMock.mock.calls.filter((c) => strip(c[0]) === path);
const at = (i: number) => fetchMock.mock.calls[i]![1];

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  setSessionExpiredHandler(null);
  vi.unstubAllGlobals();
});

describe("apiFetch", () => {
  it("(a) sends credentials: include on every call", async () => {
    fetchMock.mockResolvedValue(json(200, {}));
    await apiFetch("/cases");
    await apiFetch("/cases", { method: "POST", json: { a: 1 } });
    for (const c of fetchMock.mock.calls) expect(c[1].credentials).toBe("include");
  });

  it("(b) body-less writes send {} as JSON; GET sends no body; FormData keeps no forced type", async () => {
    fetchMock.mockResolvedValue(json(200, {}));
    await apiFetch("/notifications/read-all", { method: "PATCH" });
    const patch = at(0);
    expect(patch.body).toBe("{}");
    expect(new Headers(patch.headers).get("Content-Type")).toBe("application/json");

    await apiFetch("/cases");
    expect(at(1).body).toBeUndefined();

    const fd = new FormData();
    fd.append("f", "x");
    await apiFetch("/documents", { method: "POST", body: fd });
    const up = at(2);
    expect(up.body).toBe(fd);
    expect(new Headers(up.headers).has("Content-Type")).toBe(false);
  });

  it("(c) a 401 triggers one refresh then one retry and returns the retry", async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, {}))
      .mockResolvedValueOnce(json(200, {}))
      .mockResolvedValueOnce(json(200, { ok: true }));
    const res = await apiFetch("/cases");
    expect(res.status).toBe(200);
    expect(fetchMock.mock.calls.map((c) => strip(c[0]))).toEqual([
      "/cases",
      "/auth/refresh",
      "/cases",
    ]);
    const refresh = at(1);
    expect(refresh.credentials).toBe("include");
    expect(refresh.method).toBe("POST");
    expect(refresh.body).toBe("{}");
  });

  it("(d) two simultaneous 401s call /auth/refresh exactly once", async () => {
    const seen = new Set<string>();
    fetchMock.mockImplementation(async (url: string) => {
      const path = strip(url);
      if (path === "/auth/refresh") {
        await new Promise((r) => setTimeout(r, 10));
        return json(200, {});
      }
      if (!seen.has(path)) {
        seen.add(path);
        return json(401, {});
      }
      return json(200, {});
    });
    const [a, b] = await Promise.all([apiFetch("/a"), apiFetch("/b")]);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(calls("/auth/refresh")).toHaveLength(1);
    // the shared promise is cleared: a later 401 can refresh again
    seen.clear();
    await apiFetch("/a");
    expect(calls("/auth/refresh")).toHaveLength(2);
  });

  it("(e) failed refresh calls onSessionExpired once and surfaces ApiError(401)", async () => {
    const expired = vi.fn();
    setSessionExpiredHandler(expired);
    fetchMock
      .mockResolvedValueOnce(json(401, { error: { code: "UNAUTHORIZED", message: "nope" } }))
      .mockResolvedValueOnce(json(401, {}));
    const err = await apiJson("/cases").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(401);
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it("a network failure during refresh counts as a failed refresh", async () => {
    const expired = vi.fn();
    setSessionExpiredHandler(expired);
    fetchMock.mockResolvedValueOnce(json(401, {})).mockRejectedValueOnce(new TypeError("offline"));
    const res = await apiFetch("/cases");
    expect(res.status).toBe(401);
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it("(f) a 401 on /auth/login is not retried and is not session expiry", async () => {
    const expired = vi.fn();
    setSessionExpiredHandler(expired);
    fetchMock.mockResolvedValue(
      json(401, { error: { code: "INVALID_CREDENTIALS", message: "bad" } }),
    );
    const err = await apiJson("/auth/login", { method: "POST", json: {} }).catch((e: unknown) => e);
    expect((err as ApiError).status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(expired).not.toHaveBeenCalled();
  });

  it("does not retry /auth/refresh or /auth/logout on 401", async () => {
    fetchMock.mockResolvedValue(json(401, {}));
    await apiFetch("/auth/logout", { method: "POST" });
    await apiFetch("/auth/refresh", { method: "POST" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("a retry that also returns 401 surfaces ApiError(401) without a second refresh or loop", async () => {
    const expired = vi.fn();
    setSessionExpiredHandler(expired);
    fetchMock
      .mockResolvedValueOnce(json(401, {}))
      .mockResolvedValueOnce(json(200, {}))
      .mockResolvedValueOnce(json(401, { error: { code: "UNAUTHORIZED", message: "still no" } }));
    const err = await apiJson("/cases").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(401);
    expect(fetchMock.mock.calls.map((c) => strip(c[0]))).toEqual([
      "/cases",
      "/auth/refresh",
      "/cases",
    ]);
    expect(expired).not.toHaveBeenCalled();
  });
});

describe("apiJson errors", () => {
  it("(g) maps the backend error shape", async () => {
    fetchMock.mockResolvedValue(
      json(400, { error: { code: "VALIDATION", message: "x", details: { title: "Required" } } }),
    );
    const err = await apiJson("/cases", { method: "POST", json: {} }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    const e = err as ApiError;
    expect(e.status).toBe(400);
    expect(e.code).toBe("VALIDATION");
    expect(e.message).toBe("x");
    expect(fieldErrors(e)).toEqual({ title: "Required" });
  });

  it("(g) a non-JSON error body becomes UNKNOWN", async () => {
    fetchMock.mockResolvedValue(new Response("<html>bad gateway</html>", { status: 502 }));
    const err = (await apiJson("/cases").catch((e: unknown) => e)) as ApiError;
    expect(err.status).toBe(502);
    expect(err.code).toBe("UNKNOWN");
    expect(fieldErrors(err)).toEqual({});
    expect(fieldErrors(new Error("x"))).toEqual({});
  });

  it("tolerates a JSON error body with the wrong shape", async () => {
    fetchMock.mockResolvedValue(json(500, "oops"));
    const err = (await apiJson("/cases").catch((e: unknown) => e)) as ApiError;
    expect(err.code).toBe("UNKNOWN");
  });

  it("exposes isNotFound / isForbidden", () => {
    expect(new ApiError(404, "NOT_FOUND", "m").isNotFound).toBe(true);
    expect(new ApiError(403, "FORBIDDEN", "m").isForbidden).toBe(true);
  });

  it("(h) 204 resolves to undefined", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    expect(await apiJson("/x", { method: "DELETE" })).toBeUndefined();
  });
});

describe("apiDownload", () => {
  function spyClick() {
    const state: { clicked?: HTMLAnchorElement } = {};
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      state.clicked = this;
    });
    return { state, click };
  }

  it("(i) clicks an anchor with the Content-Disposition filename and reports export headers", async () => {
    fetchMock.mockResolvedValue(
      new Response("a,b", {
        status: 200,
        headers: {
          "Content-Disposition": 'attachment; filename="cases.csv"',
          "X-Export-Total": "5",
          "X-Export-Truncated": "true",
        },
      }),
    );
    const revoke = vi.fn();
    Object.assign(URL, { createObjectURL: () => "blob:x", revokeObjectURL: revoke });
    const { state, click } = spyClick();
    const result = await apiDownload("/reports/export", "fallback.csv");
    expect(result).toEqual({ total: 5, truncated: true });
    expect(click).toHaveBeenCalledTimes(1);
    expect(state.clicked?.download).toBe("cases.csv");
    expect(at(0).credentials).toBe("include");
    expect(revoke).toHaveBeenCalledWith("blob:x");
    click.mockRestore();
  });

  it("uses the fallback name and reports not truncated without headers", async () => {
    fetchMock.mockResolvedValue(new Response("x", { status: 200 }));
    Object.assign(URL, { createObjectURL: () => "blob:y", revokeObjectURL: () => undefined });
    const { state, click } = spyClick();
    const result = await apiDownload("/documents/1/download", "doc.pdf");
    expect(result).toEqual({ truncated: false });
    expect(state.clicked?.download).toBe("doc.pdf");
    click.mockRestore();
  });
});
