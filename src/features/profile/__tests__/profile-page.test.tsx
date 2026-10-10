import { QueryClient } from "@tanstack/react-query";
import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isSoundEnabled, playNotificationSound } from "@/lib/notification-sound";
import { makeProfile } from "@/test/render";
import { renderWithRouter } from "@/test/router";
import { ProfilePage } from "../profile-page";

vi.mock("@/lib/notification-sound", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/notification-sound")>()),
  playNotificationSound: vi.fn(),
}));

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

function setup() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(
    ["me"],
    makeProfile({
      role: "legal_rep",
      fullName: "Rex Rep",
      designation: "Senior Counsel",
      departmentName: "Finance",
    }),
  );
  return renderWithRouter(<ProfilePage />, { queryClient });
}

describe("ProfilePage", () => {
  it("shows who the signed-in person is, with a dash for details they do not have", async () => {
    setup();
    expect(await screen.findByRole("heading", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Rex Rep" })).toBeInTheDocument();
    expect(screen.getByText("Senior Counsel")).toBeInTheDocument();
    expect(screen.getByText("Finance")).toBeInTheDocument();
    expect(screen.getAllByText("Legal Representative").length).toBeGreaterThan(0);
    // no entity on this profile
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("opens the change password dialog from the Password section", async () => {
    setup();
    await userEvent.click(await screen.findByRole("button", { name: /change password/i }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText(/current password/i)).toBeInTheDocument();
  });

  it("lets the person turn the notification sound off, and keeps the choice", async () => {
    setup();
    const toggle = await screen.findByRole("switch", {
      name: /play a sound for new notifications/i,
    });
    expect(toggle).toBeChecked();
    await userEvent.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(isSoundEnabled()).toBe(false);
  });

  it("plays a sample of the sound on request", async () => {
    setup();
    await userEvent.click(await screen.findByRole("button", { name: /play sample/i }));
    expect(playNotificationSound).toHaveBeenCalledTimes(1);
  });
});
