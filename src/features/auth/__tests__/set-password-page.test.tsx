import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { SetPasswordPage } from "../set-password-page";

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

const TOKEN = "a".repeat(64);

async function fill(password: string, confirm = password) {
  const ue = userEvent.setup();
  await ue.type(screen.getByLabelText(/^new password$/i), password);
  await ue.type(screen.getByLabelText(/^confirm password$/i), confirm);
  await ue.click(screen.getByRole("button", { name: /set password/i }));
  return ue;
}

describe("SetPasswordPage", () => {
  it("asks for the new password twice, with a show/hide eye on each", async () => {
    await renderPage(<SetPasswordPage token={TOKEN} />);
    expect(screen.getByRole("heading", { name: /choose your password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password$/i)).toHaveAttribute("type", "password");
    expect(screen.getByLabelText(/^confirm password$/i)).toHaveAttribute("type", "password");
    expect(screen.getAllByRole("button", { name: /show password/i })).toHaveLength(2);
  });

  it("explains the rule before anything goes wrong", async () => {
    await renderPage(<SetPasswordPage token={TOKEN} />);
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it("rejects an empty form without calling the server", async () => {
    await renderPage(<SetPasswordPage token={TOKEN} />);
    await userEvent.click(screen.getByRole("button", { name: /set password/i }));
    expect(await screen.findByText(/enter a new password/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a password shorter than 8 characters", async () => {
    await renderPage(<SetPasswordPage token={TOKEN} />);
    await fill("short");
    expect(await screen.findByText(/use at least 8 characters/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects two passwords that differ", async () => {
    await renderPage(<SetPasswordPage token={TOKEN} />);
    await fill("LongEnough#1", "LongEnough#2");
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the token and password, then goes to sign-in with a confirmation", async () => {
    fetchMock.mockResolvedValue(respond(204));
    const { router } = await renderPage(<SetPasswordPage token={TOKEN} />);
    await fill("LongEnough#1");

    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(router.state.location.search).toMatchObject({ notice: "password-set" });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toMatch(/\/auth\/set-password$/);
    expect(JSON.parse(init.body)).toEqual({ token: TOKEN, newPassword: "LongEnough#1" });
    expect(init.method).toBe("POST");
  });

  it("disables the button while it is sending", async () => {
    let finish: (r: Response) => void = () => {};
    fetchMock.mockReturnValue(new Promise<Response>((resolve) => (finish = resolve)));
    await renderPage(<SetPasswordPage token={TOKEN} />);
    await fill("LongEnough#1");
    expect(await screen.findByRole("button", { name: /set password/i })).toBeDisabled();
    finish(respond(204));
  });

  it("says the link is dead, and offers a new one, when the server refuses it", async () => {
    fetchMock.mockResolvedValue(
      respond(400, {
        error: {
          code: "VALIDATION_ERROR",
          message: "This link is no longer valid. Ask for a new one.",
        },
      }),
    );
    await renderPage(<SetPasswordPage token={TOKEN} />);
    await fill("LongEnough#1");
    expect(
      await screen.findByRole("heading", { name: /this link is no longer valid/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /send me a new link/i })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
    expect(screen.queryByLabelText(/^new password$/i)).not.toBeInTheDocument();
  });

  it("shows the dead-link page straight away when there is no token in the address", async () => {
    await renderPage(<SetPasswordPage token={undefined} />);
    expect(
      screen.getByRole("heading", { name: /this link is no longer valid/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /send me a new link/i })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps the form and says so when the server cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await renderPage(<SetPasswordPage token={TOKEN} />);
    await fill("LongEnough#1");
    expect(await screen.findByRole("alert")).toHaveTextContent(/could not reach the server/i);
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
  });

  it("offers a way back to sign-in", async () => {
    await renderPage(<SetPasswordPage token={TOKEN} />);
    expect(screen.getByRole("link", { name: /back to sign in/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
