import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ForgotPasswordPage } from "../forgot-password-page";

afterEach(cleanup);

/** The router renders its first frame asynchronously; wait for the page's heading before asserting. */
async function renderPage(ui: ReactNode) {
  const result = renderWithProviders(ui);
  await screen.findByRole("heading");
  return result;
}

const fetchMock = vi.fn();
const respond = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

async function submit(email: string) {
  const ue = userEvent.setup();
  if (email) await ue.type(screen.getByLabelText(/^email$/i), email);
  await ue.click(screen.getByRole("button", { name: /send link/i }));
}

describe("ForgotPasswordPage", () => {
  it("asks for the email address", async () => {
    await renderPage(<ForgotPasswordPage />);
    expect(screen.getByRole("heading", { name: /forgot your password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to sign in/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("rejects an empty or malformed address without calling the server", async () => {
    await renderPage(<ForgotPasswordPage />);
    await submit("");
    expect(await screen.findByText(/enter your email address/i)).toBeInTheDocument();
    await submit("not-an-email");
    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the address and then says a link is on its way, without confirming the account exists", async () => {
    fetchMock.mockResolvedValue(
      respond(202, { message: "If that account exists, we have emailed it a link." }),
    );
    await renderPage(<ForgotPasswordPage />);
    await submit("someone@example.com");

    expect(await screen.findByText(/if that account exists/i)).toBeInTheDocument();
    expect(screen.getByText(/48 hours/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^email$/i)).not.toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toMatch(/\/auth\/forgot-password$/);
    expect(JSON.parse(init.body)).toEqual({ email: "someone@example.com" });
  });

  it("shows the same confirmation however the server answers a well-formed request", async () => {
    fetchMock.mockResolvedValue(respond(202, { message: "x" }));
    await renderPage(<ForgotPasswordPage />);
    await submit("nobody@example.com");
    expect(await screen.findByText(/if that account exists/i)).toBeInTheDocument();
  });

  it("tells the user to wait when they have asked too many times", async () => {
    fetchMock.mockResolvedValue(
      respond(429, { error: { code: "RATE_LIMITED", message: "Rate limit exceeded" } }),
    );
    await renderPage(<ForgotPasswordPage />);
    await submit("someone@example.com");
    expect(await screen.findByRole("alert")).toHaveTextContent(/too many attempts/i);
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
  });

  it("says so when the server cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await renderPage(<ForgotPasswordPage />);
    await submit("someone@example.com");
    expect(await screen.findByRole("alert")).toHaveTextContent(/could not reach the server/i);
  });
});
