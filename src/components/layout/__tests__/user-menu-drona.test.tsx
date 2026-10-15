import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Profile, UserDto } from "@/lib/api/types";
import { UserRowMenu } from "@/features/users/user-row-menu";
import { UserMenu } from "../user-menu";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

afterEach(cleanup);

const me = { id: "u1", fullName: "Vivek Admin", role: "admin", designation: null } as Profile;
const user = { id: "u2", fullName: "Priya", isActive: true, isInvited: true } as UserDto;

function withMode(mode: "local" | "drona", ui: React.ReactNode) {
  const client = new QueryClient();
  client.setQueryData(["auth-config"], { mode, localLoginAllowed: mode === "local" });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("password sign-in screens follow the server's sign-in mode", () => {
  it("shows Sign out with password sign-in", async () => {
    withMode("local", <UserMenu me={me} />);
    await userEvent.click(screen.getByRole("button", { name: /account menu/i }));
    expect(screen.getByRole("menuitem", { name: /sign out/i })).toBeInTheDocument();
  });

  it("hides Sign out in Drona mode but keeps Profile", async () => {
    withMode("drona", <UserMenu me={me} />);
    await userEvent.click(screen.getByRole("button", { name: /account menu/i }));
    expect(screen.getByRole("link", { name: /profile/i })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /sign out/i })).not.toBeInTheDocument();
  });

  const row = (
    <UserRowMenu
      user={user}
      isSelf={false}
      onEdit={vi.fn()}
      onRole={vi.fn()}
      onSendLink={vi.fn()}
      onToggleActive={vi.fn()}
    />
  );

  it("offers Resend invite with password sign-in", async () => {
    withMode("local", row);
    await userEvent.click(screen.getByRole("button", { name: /actions for priya/i }));
    expect(screen.getByRole("menuitem", { name: /resend invite/i })).toBeInTheDocument();
  });

  it("drops the invite and reset link action in Drona mode", async () => {
    withMode("drona", row);
    await userEvent.click(screen.getByRole("button", { name: /actions for priya/i }));
    expect(screen.getByRole("menuitem", { name: /edit/i })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /invite|reset link/i })).not.toBeInTheDocument();
  });
});
