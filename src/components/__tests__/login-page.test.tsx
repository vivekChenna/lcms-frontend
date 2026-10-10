import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "../login-page";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  // a plain anchor is enough: these tests only look at where the link points
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

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

function setup(redirect?: string, notice?: "password-changed" | "password-set") {
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
  it("keeps Sign in disabled until both the email and the password are filled in", async () => {
    const { ue } = setup();
    const button = screen.getByRole("button", { name: /sign in/i });
    expect(button).toBeDisabled();
    await ue.type(screen.getByLabelText(/email/i), "v@x.com");
    expect(button).toBeDisabled();
    await ue.type(screen.getByLabelText(/^password$/i), "x");
    expect(button).toBeEnabled();
    await ue.clear(screen.getByLabelText(/email/i));
    expect(button).toBeDisabled();
  });

  it("shows the password-changed notice when asked", () => {
    setup(undefined, "password-changed");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Password changed. Sign in with your new password.",
    );
  });

  it("confirms a freshly chosen password when asked", () => {
    setup(undefined, "password-set");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Password set. Sign in with your new password.",
    );
  });

  it("links to the forgotten-password page", () => {
    setup();
    expect(screen.getByRole("link", { name: /forgot password\?/i })).toHaveAttribute(
      "href",
      "/forgot-password",
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
    await ue.type(screen.getByLabelText(/^password$/i), "whatever");
    await ue.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not scold an empty password just because the field was visited", async () => {
    const { ue } = setup();
    await ue.click(screen.getByLabelText(/^password$/i));
    await ue.tab();
    await ue.click(screen.getByLabelText(/^password$/i));
    expect(screen.queryByText("Enter your password.")).not.toBeInTheDocument();
  });

  it("flags a malformed email as soon as the field is left, but not an empty one", async () => {
    const { ue } = setup();
    await ue.click(screen.getByLabelText(/email/i));
    await ue.tab();
    expect(screen.queryByText("Enter a valid email address.")).not.toBeInTheDocument();
    await ue.type(screen.getByLabelText(/email/i), "not-an-email");
    await ue.tab();
    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
  });

  it("asks for a password but does not apply the new-password length rule to sign-in", async () => {
    fetchMock.mockResolvedValue(
      json(401, { error: { code: "UNAUTHORIZED", message: "Invalid email or password" } }),
    );
    const { ue } = setup();
    await ue.type(screen.getByLabelText(/email/i), "v@x.com");
    // nothing to send without a password: the button stays off
    expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();

    // a short password is the server's call to reject, not the form's
    await ue.type(screen.getByLabelText(/^password$/i), "abc");
    await ue.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
    expect(fetchMock).toHaveBeenCalledTimes(1);
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

  it("ignores an off-site redirect and goes to the dashboard", async () => {
    fetchMock.mockResolvedValue(json(200, { user }));
    const { ue } = setup("//evil.com");
    await signIn(ue);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ href: "/dashboard" }));
  });
});
