import { QueryClient } from "@tanstack/react-query";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setViewport } from "@/test/media";
import { renderWithRouter } from "@/test/router";
import { ChangePasswordDialog } from "../change-password-dialog";

const fetchMock = vi.fn();
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  setViewport(1280);
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function setup() {
  const onOpenChange = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  queryClient.setQueryData(["me"], { id: "u1", fullName: "A", role: "viewer" });
  const r = renderWithRouter(<ChangePasswordDialog open onOpenChange={onOpenChange} />, {
    path: "/cases",
    queryClient,
  });
  return { ...r, onOpenChange, ue: userEvent.setup() };
}

async function fill(
  ue: ReturnType<typeof userEvent.setup>,
  current: string,
  next: string,
  confirm: string,
) {
  await ue.type(await screen.findByLabelText(/current password/i), current);
  await ue.type(screen.getByLabelText(/^new password$/i), next);
  await ue.type(screen.getByLabelText(/confirm new password/i), confirm);
  await ue.click(screen.getByRole("button", { name: /change password/i }));
}

const urls = () => fetchMock.mock.calls.map(([url]) => String(url));

describe("ChangePasswordDialog", () => {
  it("warns that every device, including this one, is signed out", async () => {
    setup();
    expect(
      await screen.findByText("You'll be signed out on all devices, including this one."),
    ).toBeInTheDocument();
  });

  it("on success signs out and goes to /login with the password-changed notice", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const { ue, router, queryClient } = setup();
    await fill(ue, "Password123!", "NewPassword1!", "NewPassword1!");
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(router.state.location.search).toEqual({ notice: "password-changed" });
    expect(urls()[0]).toMatch(/\/auth\/change-password$/);
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual({
      currentPassword: "Password123!",
      newPassword: "NewPassword1!",
    });
    expect(urls()[1]).toMatch(/\/auth\/logout$/);
    expect(queryClient.getQueryData(["me"])).toBeUndefined();
  });

  it("checks the confirmation and the minimum length before calling the backend", async () => {
    const { ue } = setup();
    await fill(ue, "Password123!", "short", "other");
    expect(await screen.findByText("Use at least 8 characters.")).toBeInTheDocument();
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("puts a wrong current password on its field and stays open", async () => {
    fetchMock.mockResolvedValue(
      json(400, { error: { code: "VALIDATION_ERROR", message: "Current password is incorrect" } }),
    );
    const { ue, onOpenChange, router } = setup();
    await fill(ue, "wrongpass", "NewPassword1!", "NewPassword1!");
    expect(await screen.findByText("Current password is incorrect")).toBeInTheDocument();
    expect(screen.getByLabelText(/current password/i)).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(urls()).toHaveLength(1);
    expect(router.state.location.pathname).toBe("/cases");
  });

  it("shows other server errors in a banner and stays open", async () => {
    fetchMock.mockResolvedValue(
      json(500, { error: { code: "INTERNAL", message: "Something broke" } }),
    );
    const { ue, onOpenChange } = setup();
    await fill(ue, "Password123!", "NewPassword1!", "NewPassword1!");
    expect(await screen.findByRole("alert")).toHaveTextContent("Something broke");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
