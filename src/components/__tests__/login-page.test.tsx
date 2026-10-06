import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "../login-page";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));

const fetchMock = vi.fn();
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const user = { id: "u1", fullName: "Vivek Viewer", email: "v@x.com", role: "viewer" };

beforeEach(() => {
  navigate.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function setup(redirect?: string, notice?: "password-changed") {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  queryClient.setQueryData(["cases"], { stale: "from another user" });
  render(
    <QueryClientProvider client={queryClient}>
      <LoginPage redirect={redirect} notice={notice} />
    </QueryClientProvider>,
  );
  return { queryClient, ue: userEvent.setup() };
}

async function signIn(ue: ReturnType<typeof userEvent.setup>, password = "Password123!") {
  await ue.type(screen.getByLabelText(/email/i), "v@x.com");
  await ue.type(screen.getByLabelText(/^password$/i), password);
  await ue.click(screen.getByRole("button", { name: /sign in/i }));
}

describe("LoginPage", () => {
  it("shows the password-changed notice when asked", () => {
    setup(undefined, "password-changed");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Password changed. Sign in with your new password.",
    );
  });

  it("shows no notice by default", () => {
    setup();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the server message on a wrong password and stays on the page", async () => {
    fetchMock.mockResolvedValue(
      json(401, { error: { code: "UNAUTHORIZED", message: "Invalid email or password" } }),
    );
    const { ue } = setup();
    await signIn(ue, "wrongpass1");
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
    expect(navigate).not.toHaveBeenCalled();
  });

  it("shows a friendly message when rate limited", async () => {
    fetchMock.mockResolvedValue(json(429, { error: { code: "RATE_LIMITED", message: "x" } }));
    const { ue } = setup();
    await signIn(ue);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many attempts, try again shortly",
    );
  });

  it("validates the form before calling the backend", async () => {
    const { ue } = setup();
    await ue.type(screen.getByLabelText(/email/i), "not-an-email");
    await ue.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("on success clears the cache, stores the session user and navigates to the redirect", async () => {
    fetchMock.mockResolvedValue(json(200, { user, accessToken: "a", refreshToken: "r" }));
    const { queryClient, ue } = setup("/cases?page=2");
    await signIn(ue);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ href: "/cases?page=2" }));
    expect(queryClient.getQueryData(["cases"])).toBeUndefined();
    expect(queryClient.getQueryData(["me"])).toEqual(user);
    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.credentials).toBe("include");
    expect(JSON.parse(init.body)).toEqual({ email: "v@x.com", password: "Password123!" });
  });

  it("ignores an off-site redirect and goes home", async () => {
    fetchMock.mockResolvedValue(json(200, { user }));
    const { ue } = setup("//evil.com");
    await signIn(ue);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ href: "/" }));
  });
});
