import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PageTransition } from "../page-transition";

afterEach(cleanup);

function setup() {
  const root = createRootRoute({
    component: () => (
      <PageTransition>
        <Outlet />
      </PageTransition>
    ),
  });
  const a = createRoute({ getParentRoute: () => root, path: "/a", component: () => <p>Page A</p> });
  const b = createRoute({ getParentRoute: () => root, path: "/b", component: () => <p>Page B</p> });
  const router = createRouter({
    routeTree: root.addChildren([a, b]),
    history: createMemoryHistory({ initialEntries: ["/a"] }),
  });
  render(<RouterProvider router={router as never} />);
  return router;
}

describe("PageTransition", () => {
  it("renders the current page and swaps to the next on navigation", async () => {
    const router = setup();
    expect(await screen.findByText("Page A")).toBeInTheDocument();
    await act(() => router.navigate({ to: "/b" as never }));
    expect(await screen.findByText("Page B")).toBeInTheDocument();
    expect(screen.queryByText("Page A")).not.toBeInTheDocument();
  });
});
