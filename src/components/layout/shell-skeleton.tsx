import { ListSkeleton } from "@/components/common/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar } from "./sidebar";

const STORAGE_KEY = "lcms-sidebar";

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "collapsed";
  } catch {
    return false;
  }
}

/**
 * The app's frame, drawn before the session has loaded: the sidebar with its brand and shimmering
 * menu rows, the top bar, and a placeholder page. It mirrors AppShell (same widths, same collapsed
 * choice) so that when the real shell replaces it, nothing moves; the frame is simply "already
 * there" on a refresh instead of the whole screen being blank until the server answers.
 */
export function ShellSkeleton() {
  const collapsed = readCollapsed();
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex min-h-dvh bg-background text-foreground"
    >
      <aside
        className={
          "sticky top-0 hidden h-dvh shrink-0 overflow-hidden border-r border-sidebar-border bg-sidebar pl-[env(safe-area-inset-left)] text-sidebar-foreground md:block md:w-[calc(4.5rem+env(safe-area-inset-left))]" +
          (collapsed ? "" : " lg:w-[calc(15rem+env(safe-area-inset-left))]")
        }
      >
        {/* the real Sidebar, with no role yet: same brand header and widths, placeholder menu */}
        <Sidebar collapsed={collapsed} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b bg-background px-4 md:px-6">
          <Skeleton className="h-5 w-32" />
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="hidden h-4 w-28 sm:block" />
          </div>
        </header>
        <main className="mx-auto w-full min-w-0 max-w-[1500px] flex-1 space-y-5 px-4 pt-4 md:px-6 md:pt-6">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <ListSkeleton columns={6} rows={6} />
        </main>
      </div>
    </div>
  );
}
