import { useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useMe } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { titleFor } from "./nav-items";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

const STORAGE_KEY = "lcms-sidebar";

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
 */
export function AppShell({ children }: { children: ReactNode }) {
  const me = useMe();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [navOpen, setNavOpen] = useState(false);

  // The _authed guard has loaded `me` before this renders.
  if (!me) return null;

  const toggle = (next: boolean) => {
    setCollapsed(next);
    writeCollapsed(next);
  };

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 border-r border-sidebar-border md:block md:w-[4.5rem]",
          collapsed ? "lg:w-[4.5rem]" : "lg:w-60",
        )}
      >
        <Sidebar role={me.role} collapsed={collapsed} onCollapsedChange={toggle} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={titleFor(pathname)} me={me} onOpenNav={() => setNavOpen(true)} />
        <main className="mx-auto w-full min-w-0 max-w-[1500px] flex-1 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:p-6">
          {children}
        </main>
      </div>
      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent
          side="left"
          aria-describedby={undefined}
          className="w-72 max-w-[85vw] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground [&>button]:right-1.5 [&>button]:top-1.5 [&>button]:grid [&>button]:size-11 [&>button]:place-items-center"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar role={me.role} variant="sheet" onNavigate={() => setNavOpen(false)} />
        </SheetContent>
      </Sheet>
      <Toaster richColors position="top-right" />
    </div>
  );
}
