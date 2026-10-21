// Compile-time guard: fails `tsc` if the generated schema drifts from what the app relies on.
import type {
  AgeingReportDto,
  AuditListDto,
  BusinessUnitListDto,
  CaseAuditDto,
  BusinessUnitDto,
  CaseCategoryDto,
  CaseCategoryListDto,
  CaseTypeDto,
  ClosureOutcomeDto,
  DepartmentDto,
  EntityDto,
  CaseDto,
  CaseListDto,
  CaseListQuery,
  CaseTypeListDto,
  ClosureOutcomeListDto,
  CommentListDto,
  CreateCaseBody,
  DashboardDto,
  DepartmentListDto,
  DocumentListDto,
  EntityListDto,
  InfoRequestListDto,
  LoginResponse,
  NotificationListDto,
  Profile,
  RepWorkloadReportDto,
  RoutingRuleListDto,
  SlaComplianceReportDto,
  UserDto,
  UserListDto,
  UserRole,
  VolumeByCategoryReportDto,
  VolumeByOrganisationReportDto,
} from "./types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;
type IsAny<T> = 0 extends 1 & T ? true : false;
type IsUnknown<T> = unknown extends T ? (IsAny<T> extends true ? false : true) : false;
type IsNever<T> = [T] extends [never] ? true : false;
// true only when T is not never, any or unknown
type NotNever<T> =
  IsAny<T> extends true
    ? false
    : IsUnknown<T> extends true
      ? false
      : IsNever<T> extends true
        ? false
        : true;

export const _status: CaseDto["status"][] = [
  "Submitted",
  "Assigned",
  "In Progress",
  "Waiting on Input",
  "Closed",
];
export const _priority: CaseDto["priority"][] = ["P1", "P2", "P3", "P4"];
export const _sla: CaseDto["slaState"][] = ["on_track", "at_risk", "breached", "met"];
export const _names: CaseDto["requesterName"][] = ["a", null];
export const _catName: CaseDto["categoryName"] = null;
export const _typeName: CaseDto["caseTypeName"] = null;
export const _deptName: CaseDto["departmentName"] = null;
export const _entName: CaseDto["entityName"] = null;
export const _buName: CaseDto["businessUnitName"] = null;
export const _repName: CaseDto["assignedLegalRepName"] = null;
export const _value: CaseDto["estimatedValue"][] = [1, null];
export const _query: CaseListQuery = {
  page: 1,
  pageSize: 20,
  status: "Closed",
  priority: "P1",
  categoryId: "x",
  caseTypeId: "x",
  entityId: "x",
  businessUnitId: "x",
  departmentId: "x",
  assignedLegalRepId: "x",
  search: "x",
  slaState: "breached",
  open: "true",
};
export const _list = (l: CaseListDto): CaseDto => l.items[0] as CaseDto;
export const _create: CreateCaseBody = {
  title: "t",
  description: "d",
  declarationConfirmed: true,
  categoryId: "x",
  caseTypeId: "x",
  departmentId: "x",
  incidentDate: "2026-01-01",
  businessDeadline: "2026-12-31",
};
export const _dash = (d: DashboardDto) => [
  d.tiles.assignedToMe,
  d.tiles.unassigned,
  d.myAssignedCases,
  d.managerPanels?.openCaseloadByRep,
  d.managerPanels?.unassigned.items,
  d.managerPanels?.awaitingAcceptance.count,
];

export type _Checks = [
  Expect<NotNever<CaseDto>>,
  Expect<NotNever<CaseListDto>>,
  Expect<NotNever<DashboardDto>>,
  Expect<NotNever<Profile>>,
  Expect<NotNever<LoginResponse>>,
  Expect<
    Equal<
      CaseDto["status"],
      "Submitted" | "Assigned" | "In Progress" | "Waiting on Input" | "Closed"
    >
  >,
  Expect<Equal<CaseDto["priority"], "P1" | "P2" | "P3" | "P4">>,
  Expect<Equal<CaseDto["slaState"], "on_track" | "at_risk" | "breached" | "met">>,
  Expect<Equal<CaseDto["estimatedValue"], number | null>>,
  Expect<Equal<CaseDto["requesterName"], string | null>>,
  Expect<Equal<Profile["role"], UserRole>>,
  Expect<Equal<LoginResponse["user"]["role"], UserRole>>,
  Expect<Equal<UserRole, Profile["role"]>>,
  Expect<NotNever<UserDto>>,
  Expect<NotNever<UserListDto>>,
  Expect<NotNever<NotificationListDto>>,
  Expect<NotNever<CaseAuditDto>>,
  Expect<NotNever<CommentListDto>>,
  Expect<NotNever<DocumentListDto>>,
  Expect<NotNever<InfoRequestListDto>>,
  Expect<NotNever<AuditListDto>>,
  Expect<NotNever<SlaComplianceReportDto>>,
  Expect<NotNever<AgeingReportDto>>,
  Expect<NotNever<VolumeByCategoryReportDto>>,
  Expect<NotNever<VolumeByOrganisationReportDto>>,
  Expect<NotNever<RepWorkloadReportDto>>,
  Expect<NotNever<CaseCategoryListDto>>,
  Expect<NotNever<CaseTypeListDto>>,
  Expect<NotNever<DepartmentListDto>>,
  Expect<NotNever<EntityListDto>>,
  Expect<NotNever<BusinessUnitListDto>>,
  Expect<NotNever<ClosureOutcomeListDto>>,
  Expect<NotNever<RoutingRuleListDto>>,
  Expect<NotNever<CaseCategoryDto>>,
  Expect<NotNever<CaseTypeDto>>,
  Expect<NotNever<DepartmentDto>>,
  Expect<NotNever<EntityDto>>,
  Expect<NotNever<BusinessUnitDto>>,
  Expect<NotNever<ClosureOutcomeDto>>,
  Expect<Equal<CaseCategoryDto, { id: string; name: string; isActive: boolean }>>,
  Expect<Equal<LoginResponse["user"], Profile>>,
];
