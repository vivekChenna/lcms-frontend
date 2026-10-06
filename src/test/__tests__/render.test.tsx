import { Link } from "@tanstack/react-router";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useMe } from "@/lib/auth";
import { makeProfile, renderWithProviders } from "../render";

function Who() {
  const me = useMe();
  return (
    <div>
      <span>{me?.fullName}</span>
      <span data-testid="role">{me?.role}</span>
      <Link to="/cases">Cases</Link>
    </div>
  );
}

afterEach(cleanup); // vitest globals are off, so unmount between tests explicitly

// Usage: seed the signed-in user with `me`, start at `route`, assert on the screen.
describe("renderWithProviders", () => {
  it("seeds the session so components see the given profile", async () => {
    renderWithProviders(<Who />, { me: makeProfile({ role: "legal_manager", fullName: "Mia" }) });
    expect(await screen.findByText("Mia")).toBeInTheDocument();
    expect(screen.getByTestId("role")).toHaveTextContent("legal_manager");
  });

  it("renders Link with a real href", async () => {
    renderWithProviders(<Who />, { me: makeProfile() });
    expect(await screen.findByRole("link", { name: "Cases" })).toHaveAttribute("href", "/cases");
  });

  it("starts at the given route and exposes the router", async () => {
    const { router } = renderWithProviders(<Who />, {
      me: makeProfile(),
      route: "/cases?status=Closed",
    });
    await screen.findByText("Cases");
    expect(router.state.location.pathname).toBe("/cases");
  });

  it("gives every render a fresh client with no retries", async () => {
    const a = renderWithProviders(<span>a</span>);
    const b = renderWithProviders(<span>b</span>);
    expect(a.queryClient).not.toBe(b.queryClient);
    expect(a.queryClient.getDefaultOptions().queries?.retry).toBe(false);
    expect(a.queryClient.getQueryData(["me"])).toBeUndefined();
  });

  it("makeProfile has defaults per role and accepts overrides", () => {
    expect(makeProfile({ role: "requester" }).role).toBe("requester");
    expect(makeProfile({ role: "admin" }).email).toContain("admin");
    expect(makeProfile({ email: "x@y.z" }).email).toBe("x@y.z");
  });
});
