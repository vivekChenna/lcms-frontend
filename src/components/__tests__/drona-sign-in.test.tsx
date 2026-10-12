import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DronaSignIn } from "../drona-sign-in";

const fetchMock = vi.fn();
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const user = { id: "u1", fullName: "Vivek Viewer", email: "v@x.com", role: "viewer" };

function drona(profile: unknown, fails = false) {
  window.DronaHQ = {
    IsReady: true,
    user: {
      getProfile: (ok, err) => (fails ? err(new Error("no")) : ok(profile as { email?: unknown })),
    },
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  delete window.DronaHQ;
  vi.unstubAllGlobals();
});

function setup() {
  const onSignedIn = vi.fn();
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}
    >
      <DronaSignIn onSignedIn={onSignedIn} />
    </QueryClientProvider>,
  );
  return onSignedIn;
}

describe("DronaSignIn", () => {
  it("signs in with the normalised Drona profile email as soon as it is shown", async () => {
    drona({ email: "  V@X.com " });
    fetchMock.mockResolvedValueOnce(json(200, { accessToken: "a", refreshToken: "r", user }));
    const onSignedIn = setup();
    await waitFor(() => expect(onSignedIn).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/auth/drona");
    expect(JSON.parse(init.body as string)).toEqual({ email: "v@x.com" });
  });

  it("shows the server's reason when no account matches, and retries on the button", async () => {
    drona({ email: "v@x.com" });
    const body = {
      error: {
        code: "UNAUTHORIZED",
        message: "No active LCMS account matches this Drona profile.",
      },
    };
    fetchMock.mockResolvedValueOnce(json(401, body));
    const onSignedIn = setup();
    expect(await screen.findByRole("alert")).toHaveTextContent(/no active lcms account/i);
    expect(onSignedIn).not.toHaveBeenCalled();

    fetchMock.mockResolvedValueOnce(json(200, { accessToken: "a", refreshToken: "r", user }));
    await userEvent.click(screen.getByRole("button", { name: /continue with drona/i }));
    await waitFor(() => expect(onSignedIn).toHaveBeenCalled());
  });

  it("reports an unusable profile without calling the server", async () => {
    drona({ email: "not-an-email" });
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent(/valid profile email/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports when Drona cannot provide the session", async () => {
    drona(null, true);
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /could not provide the current session/i,
    );
  });
});
