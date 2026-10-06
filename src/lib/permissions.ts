import type { UserRole } from "@/lib/api/types";

// The single permission matrix, copied from the backend `requireRole` gates.
export type NavKey =
  | "dashboard"
  | "cases"
  | "new-request"
  | "reports"
  | "audit"
  | "users"
  | "master-data"
  | "rules"
  | "notifications";

const NAV: Record<NavKey, readonly UserRole[]> = {
  dashboard: ["admin", "legal_manager", "legal_rep", "requester", "viewer"],
  cases: ["admin", "legal_manager", "legal_rep", "requester", "viewer"],
  "new-request": ["requester", "legal_rep", "admin"],
  reports: ["admin", "legal_manager", "viewer"],
  audit: ["admin", "legal_manager"],
  users: ["admin", "legal_manager"],
  "master-data": ["admin"],
  rules: ["admin", "legal_manager"],
  notifications: ["admin", "legal_manager", "legal_rep", "requester", "viewer"],
};

const anyOf =
  (...roles: UserRole[]) =>
  (r: UserRole) =>
    roles.includes(r);

export const canSee = (role: UserRole, key: NavKey) => NAV[key].includes(role);
export const rolesFor = (key: NavKey) => NAV[key];
export const isLegal = anyOf("admin", "legal_manager", "legal_rep");

export const can = {
  editCase: anyOf("requester", "legal_rep", "admin"),
  assign: anyOf("legal_manager", "admin"),
  changePriority: anyOf("legal_manager", "admin"),
  acceptOrReject: anyOf("legal_rep", "legal_manager"),
  escalate: anyOf("legal_rep", "legal_manager", "admin"),
  close: anyOf("legal_rep", "legal_manager", "admin"),
  raiseInfoRequest: anyOf("legal_rep"),
  seeInternalComments: anyOf("admin", "legal_manager", "legal_rep"),
  editUsers: anyOf("admin"),
  editRules: anyOf("admin"),
};
