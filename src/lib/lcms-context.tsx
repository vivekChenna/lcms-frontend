import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLogout, useMe } from "./auth";
import type { UserRole } from "./lcms-api";

// Legacy shell context (removed in B20). Role and user come from the real session (/auth/me);
// mounted only under the authenticated layout, so `me` is already cached.
type LcmsContextValue = {
  role: UserRole;
  user: { name: string; designation: string };
  signedIn: boolean;
  signOut: () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
};

const LcmsContext = createContext<LcmsContextValue | null>(null);

export function LcmsProvider({ children }: { children: ReactNode }) {
  const me = useMe();
  const logout = useLogout();
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);

  useEffect(() => {
    setSidebarCollapsedState(window.sessionStorage.getItem("lcms-sidebar-collapsed") === "true");
  }, []);

  const setSidebarCollapsed = (next: boolean) => {
    setSidebarCollapsedState(next);
    window.sessionStorage.setItem("lcms-sidebar-collapsed", String(next));
  };

  const role: UserRole = me?.role ?? "viewer";
  const name = me?.fullName ?? "";
  const designation = me?.designation ?? "";
  const signOut = logout.mutate;
  const value = useMemo(
    () => ({
      role,
      user: { name, designation },
      signedIn: true,
      signOut: () => signOut(),
      sidebarCollapsed,
      setSidebarCollapsed,
    }),
    [role, name, designation, signOut, sidebarCollapsed],
  );
  return <LcmsContext.Provider value={value}>{children}</LcmsContext.Provider>;
}

export function useLcms() {
  const context = useContext(LcmsContext);
  if (!context) throw new Error("useLcms must be used within LcmsProvider");
  return context;
}
