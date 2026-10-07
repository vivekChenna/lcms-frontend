import type { DashboardDto } from "@/lib/api/types";

/** Shapes matching the real `/dashboard` response (checked against the running backend). */

export const tilesBase = {
  total: 8,
  open: 7,
  awaitingAcceptance: 2,
  waitingOnInput: 1,
  overdue: 1,
  onTime: 7,
  closed: 1,
};

export const filtersBase = {
  total: {},
  open: { open: "true" },
  awaitingAcceptance: { status: "Assigned" },
  waitingOnInput: { status: "Waiting on Input" },
  overdue: { open: "true", slaState: "breached" },
  closed: { status: "Closed" },
  unassigned: { status: "Submitted" },
  assignedToMe: { open: "true", assignedLegalRepId: "rep-1" },
};

export const byStatusBase = [
  { status: "Submitted" as const, count: 2 },
  { status: "Assigned" as const, count: 2 },
  { status: "In Progress" as const, count: 2 },
  { status: "Waiting on Input" as const, count: 1 },
  { status: "Closed" as const, count: 1 },
];

export function requesterDashboard(): DashboardDto {
  return {
    tiles: { ...tilesBase, assignedToMe: 0, unassigned: 2 },
    filters: filtersBase,
    byStatus: byStatusBase,
  };
}

export function viewerDashboard(): DashboardDto {
  return requesterDashboard();
}

export function repDashboard(): DashboardDto {
  return {
    tiles: { ...tilesBase, assignedToMe: 4, unassigned: 2 },
    filters: filtersBase,
    byStatus: byStatusBase,
    myAssignedCases: [
      {
        id: "c-assigned",
        referenceNumber: "AGC-INT-000002",
        title: "[Demo] Lease renewal advice",
        priority: "P3",
        status: "Assigned",
        resolutionDueAt: "2026-10-09T20:12:18.829Z",
        slaState: "on_track",
        assignedLegalRepName: "Vivek Legal Rep",
      },
      {
        id: "c-in-progress",
        referenceNumber: "AGC-INT-000003",
        title: "[Demo] NDA review",
        priority: "P2",
        status: "In Progress",
        resolutionDueAt: "2026-10-05T20:12:18.829Z",
        slaState: "breached",
        assignedLegalRepName: "Vivek Legal Rep",
      },
    ],
  };
}

export function managerDashboard(): DashboardDto {
  return {
    tiles: { ...tilesBase, assignedToMe: 0, unassigned: 2 },
    filters: filtersBase,
    byStatus: byStatusBase,
    managerPanels: {
      openCaseloadByRep: [
        { legalRepId: "rep-1", fullName: "Vivek Legal Rep", openCount: 4, overdueCount: 0 },
        { legalRepId: "rep-2", fullName: "Vivek Legal Rep Two", overdueCount: 1, openCount: 3 },
      ],
      unassigned: {
        count: 2,
        items: [
          {
            id: "c-unassigned-1",
            referenceNumber: "AGC-INT-000001",
            title: "[Demo] Vendor payment dispute",
            priority: "P2",
            status: "Submitted",
            resolutionDueAt: "2026-10-09T20:12:18.796Z",
            slaState: "on_track",
            assignedLegalRepName: null,
          },
        ],
      },
      awaitingAcceptance: {
        count: 2,
        items: [
          {
            id: "c-awaiting-1",
            referenceNumber: "AGC-INT-000004",
            title: "[Demo] Supplier contract",
            priority: "P3",
            status: "Assigned",
            resolutionDueAt: "2026-10-11T20:12:18.796Z",
            slaState: "on_track",
            assignedLegalRepName: "Vivek Legal Rep",
          },
        ],
      },
    },
  };
}
