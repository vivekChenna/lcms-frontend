import { useRouterState } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useMe } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { NavDrawer } from "./nav-drawer";
import { titleFor } from "./nav-items";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

const STORAGE_KEY = "lcms-sidebar";
// Widths include the left safe-area inset so a notched phone in landscape still clears the notch.
const RAIL_WIDTH = "calc(4.5rem + env(safe-area-inset-left))";
const FULL_WIDTH = "calc(15rem + env(safe-area-inset-left))";

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "collapsed";
  } catch {
    return false;
  }
}

function writeCollapsed(collapsed: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "collapsed" : "expanded");
  } catch {
    // storage blocked: the choice just isn't remembered
  }
}

/**
 * Authenticated layout. Below md: hamburger + navigation sheet. md: icon rail (the hamburger
 * still opens the full sheet). From lg: full sidebar, collapsible to the rail (remembered).
 *
 * Safe areas (viewport-fit=cover): a phone in landscape has the notch on the left or right.
 * From md the rail sits on the left edge, so it takes the left inset (and grows by it) and the
 * topbar/main only add the right inset; below md there is no rail, so they take both sides.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const me = useMe();
  const { theme } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(readCollapsed);
  // `settled` trails `collapsed`: the icon-only look (labels out of sight, icons centred) only
  // applies once the width animation has finished, so labels fade out instead of snapping away.
  const [settled, setSettled] = useState(collapsed);
  const breakpoint = useBreakpoint();
  const wide = breakpoint === "lg" || breakpoint === "xl";
  const reduceMotion = useReducedMotion();
  // The sheet belongs to the path it was opened on: any navigation (link, back, redirect) closes it.
  const [navOpenAt, setNavOpenAt] = useState<string | null>(null);
  const navOpen = navOpenAt === pathname;
  const setNavOpen = (open: boolean) => setNavOpenAt(open ? pathname : null);

  // The _authed guard has loaded `me` before this renders.
  if (!me) return null;

  const toggle = (next: boolean) => {
    setCollapsed(next);
    if (!next) setSettled(false); // expanding: the full look returns at once, then the width grows
    writeCollapsed(next);
  };

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      {/* From lg the width is animated inline; below lg the class width (the rail) applies. The key
          remounts the element when crossing lg so a stale inline width never overrides the rail. */}
      <motion.aside
        key={wide ? "wide" : "narrow"}
        initial={false}
        animate={wide ? { width: collapsed ? RAIL_WIDTH : FULL_WIDTH } : {}}
        transition={{ type: "tween", duration: reduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
        onAnimationComplete={() => setSettled(collapsed)}
        className="sticky top-0 hidden h-dvh shrink-0 overflow-hidden border-r border-sidebar-border bg-sidebar pl-[env(safe-area-inset-left)] md:block md:w-[calc(4.5rem+env(safe-area-inset-left))]"
      >
        <Sidebar
          role={me.role}
          collapsed={collapsed}
          settled={settled}
          onCollapsedChange={toggle}
        />
      </motion.aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={titleFor(pathname)} me={me} onOpenNav={() => setNavOpen(true)} />
        <main className="mx-auto w-full min-w-0 max-w-[1500px] flex-1 pt-4 pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(1rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] md:pt-6 md:pr-[max(1.5rem,env(safe-area-inset-right))] md:pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pl-6">
          {children}
        </main>
      </div>
      <NavDrawer open={navOpen} onOpenChange={setNavOpen}>
        <Sidebar role={me.role} variant="sheet" onNavigate={() => setNavOpen(false)} />
      </NavDrawer>
      <Toaster richColors position="bottom-right" theme={theme} />
    </div>
  );
}
