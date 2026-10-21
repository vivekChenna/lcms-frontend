import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
} from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import { NetworkBanner } from "../components/common/network-banner";
import { NotFoundScreen } from "../components/common/not-found-screen";
import { reportLovableError } from "../lib/lovable-error-reporting";

/** A page split by a jagged crack, its two halves drifting apart: "this broke". */
function BrokenPage() {
  const drift = (dx: number, dy: number, delay: number) => ({
    animate: { x: [0, dx, 0], y: [0, dy, 0] },
    transition: { duration: 3.6, delay, repeat: Infinity, ease: "easeInOut" as const },
  });
  return (
    <svg
      viewBox="0 0 320 240"
      role="img"
      aria-label="A page split apart by a jagged crack, with a warning mark at the break"
      className="mx-auto h-auto w-full max-w-xs"
    >
      <ellipse cx="160" cy="212" rx="108" ry="12" className="fill-muted" />
      <circle cx="160" cy="112" r="94" className="fill-danger/10" />

      <motion.g {...drift(-6, -2, 0)}>
        <path
          d="M106 42h60l12 18-10 16 14 14-12 18 10 16-74 2V42Z"
          className="fill-card stroke-border"
          strokeWidth="2"
        />
        <rect x="118" y="60" width="38" height="8" rx="4" className="fill-muted" />
        <rect x="118" y="148" width="30" height="8" rx="4" className="fill-muted" />
      </motion.g>

      <motion.g {...drift(6, 2, 0.15)}>
        <path
          d="M214 42h-32l-12 18 10 16-14 14 12 18-10 16 46 2V42Z"
          className="fill-card stroke-border"
          strokeWidth="2"
        />
        <rect x="178" y="164" width="30" height="8" rx="4" className="fill-muted" />
      </motion.g>

      <motion.g {...drift(0, -4, 0.3)}>
        <circle cx="160" cy="176" r="26" className="fill-card stroke-danger" strokeWidth="6" />
        <rect x="156" y="164" width="8" height="18" rx="3" className="fill-danger" />
        <circle cx="160" cy="190" r="4" className="fill-danger" />
      </motion.g>

      <motion.g {...drift(0, 6, 0.2)}>
        <circle cx="70" cy="90" r="5" className="fill-warning" />
        <circle cx="252" cy="70" r="4" className="fill-danger/60" />
      </motion.g>
    </svg>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <BrokenPage />
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Algihaz Legal Case Management" },
      { name: "description", content: "Internal legal case management for Algihaz Holding." },
      { name: "author", content: "Algihaz Holding" },
      { property: "og:title", content: "Algihaz Legal Case Management" },
      {
        property: "og:description",
        content: "Internal legal case management for Algihaz Holding.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundScreen,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {createPortal(<HeadContent />, document.head)}
      <NetworkBanner />
      <Outlet />
    </QueryClientProvider>
  );
}
