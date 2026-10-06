import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useMe } from "./auth";
import type { UserRole } from "./lcms-api";

// Legacy page context (removed in B20). Role and user come from the real session (/auth/me);
// mounted only under the authenticated layout, so `me` is already cached. Navigation, sign out
// and the sidebar state now live in the AppShell.
type LcmsContextValue = {
  role: UserRole;
  user: { name: string; designation: string };
  signedIn: boolean;
};

const LcmsContext = createContext<LcmsContextValue | null>(null);

export function LcmsProvider({ children }: { children: ReactNode }) {
  const me = useMe();
  const role: UserRole = me?.role ?? "viewer";
  const name = me?.fullName ?? "";
  const designation = me?.designation ?? "";
  const value = useMemo(
    () => ({ role, user: { name, designation }, signedIn: true }),
    [role, name, designation],
  );
  return <LcmsContext.Provider value={value}>{children}</LcmsContext.Provider>;
}

export function useLcms() {
  const context = useContext(LcmsContext);
  if (!context) throw new Error("useLcms must be used within LcmsProvider");
  return context;
}
