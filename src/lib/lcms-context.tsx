import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { UserRole } from "./lcms-api";
import { demoUsers } from "./lcms-data";

type LcmsContextValue = {
  role: UserRole;
  setRole: (role: UserRole) => void;
  user: { name: string; designation: string };
  signedIn: boolean;
  setSignedIn: (value: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
};

const LcmsContext = createContext<LcmsContextValue | null>(null);

export function LcmsProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("legal_manager");
  const [signedIn, setSignedIn] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);

  useEffect(() => {
    const stored = window.sessionStorage.getItem("lcms-role") as UserRole | null;
    if (stored && stored in demoUsers) setRole(stored);
    setSidebarCollapsedState(window.sessionStorage.getItem("lcms-sidebar-collapsed") === "true");
  }, []);

  const setSidebarCollapsed = (next: boolean) => {
    setSidebarCollapsedState(next);
    window.sessionStorage.setItem("lcms-sidebar-collapsed", String(next));
  };

  const value = useMemo(() => ({ role, setRole: (next: UserRole) => { setRole(next); window.sessionStorage.setItem("lcms-role", next); }, user: demoUsers[role], signedIn, setSignedIn, sidebarCollapsed, setSidebarCollapsed }), [role, signedIn, sidebarCollapsed]);
  return <LcmsContext.Provider value={value}>{children}</LcmsContext.Provider>;
}

export function useLcms() {
  const context = useContext(LcmsContext);
  if (!context) throw new Error("useLcms must be used within LcmsProvider");
  return context;
}