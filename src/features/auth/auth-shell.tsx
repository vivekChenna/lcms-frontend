import { Gavel } from "lucide-react";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { BrandPanel } from "./brand-panel";

/**
 * The split-screen layout the public account pages (sign in, choose a password, forgot password)
 * share: a brand panel on the left from lg up, the form on the right. On phones the panel is
 * replaced by a slim header so the form is the first thing on screen.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh bg-background lg:h-dvh lg:grid-cols-[1.1fr_1fr] lg:overflow-hidden">
      <BrandPanel />

      <main className="relative flex min-h-0 flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 lg:invisible">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Gavel className="size-5" aria-hidden />
            </span>
            <span className="font-semibold tracking-tight">Algihaz Legal</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-6">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
          <div className="mt-8">{children}</div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {footer ?? "Algihaz Legal Case Management System"}
        </p>
      </main>
    </div>
  );
}
