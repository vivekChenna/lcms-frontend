import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setViewport } from "@/test/media";
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
  render(
    <QueryClientProvider client={queryClient}>
      <ChangePasswordDialog open onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  );
  return { onOpenChange, ue: userEvent.setup() };
}

async function fill(
  ue: ReturnType<typeof userEvent.setup>,
  current: string,
  next: string,
  confirm: string,
) {
  await ue.type(screen.getByLabelText(/current password/i), current);
  await ue.type(screen.getByLabelText(/^new password$/i), next);
  await ue.type(screen.getByLabelText(/confirm new password/i), confirm);
  await ue.click(screen.getByRole("button", { name: /change password/i }));
}

describe("ChangePasswordDialog", () => {
  it("sends currentPassword and newPassword and closes on success", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const { ue, onOpenChange } = setup();
    await fill(ue, "Password123!", "NewPassword1!", "NewPassword1!");
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toMatch(/\/auth\/change-password$/);
    expect(JSON.parse(init.body)).toEqual({
      currentPassword: "Password123!",
      newPassword: "NewPassword1!",
    });
  });

  it("checks the confirmation and the minimum length before calling the backend", async () => {
    const { ue } = setup();
    await fill(ue, "Password123!", "short", "other");
    expect(await screen.findByText("Use at least 8 characters.")).toBeInTheDocument();
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the server message when the current password is wrong", async () => {
    fetchMock.mockResolvedValue(
      json(400, { error: { code: "VALIDATION_ERROR", message: "Current password is incorrect" } }),
    );
    const { ue, onOpenChange } = setup();
    await fill(ue, "wrongpass", "NewPassword1!", "NewPassword1!");
    expect(await screen.findByRole("alert")).toHaveTextContent("Current password is incorrect");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
