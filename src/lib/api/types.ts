import type { paths } from "./schema";

type Json<T> = T extends { content: { "application/json": infer B } } ? B : never;

export type ApiResponse<
  P extends keyof paths,
  M extends keyof paths[P],
  S extends number = 200,
> = paths[P][M] extends { responses: infer R } ? (S extends keyof R ? Json<R[S]> : never) : never;

export type ApiBody<P extends keyof paths, M extends keyof paths[P]> = paths[P][M] extends {
  requestBody: { content: { "application/json": infer B } };
}
  ? B
  : never;

export type ApiQuery<P extends keyof paths, M extends keyof paths[P]> = paths[P][M] extends {
  parameters: { query?: infer Q };
}
  ? NonNullable<Q>
  : never;

export type UserRole = "admin" | "legal_manager" | "legal_rep" | "requester" | "viewer";

// OVERRIDE: the backend OpenAPI types `role` as plain `string`; narrow it to the five known roles.
type WithRole<T extends { role: string }> = Omit<T, "role"> & { role: UserRole };
export type Profile = WithRole<ApiResponse<"/auth/me", "get">>;
type RawLogin = ApiResponse<"/auth/login", "post">;
export type LoginResponse = Omit<RawLogin, "user"> & { user: WithRole<RawLogin["user"]> };
export type CaseDto = ApiResponse<"/cases/{id}", "get">;
export type CaseListDto = ApiResponse<"/cases", "get">;
export type CaseListQuery = ApiQuery<"/cases", "get">;
export type CreateCaseBody = ApiBody<"/cases", "post">;
export type DashboardDto = ApiResponse<"/dashboard", "get">;
export type CaseStatus = CaseDto["status"];
export type CasePriority = CaseDto["priority"];
export type SlaState = CaseDto["slaState"];

export type UserListDto = ApiResponse<"/users", "get">;
export type UserDto = UserListDto["items"][number];
export type NotificationListDto = ApiResponse<"/notifications", "get">;
export type CaseAuditDto = ApiResponse<"/cases/{id}/audit", "get">;
export type CommentListDto = ApiResponse<"/cases/{id}/comments", "get">;
export type DocumentListDto = ApiResponse<"/cases/{id}/documents", "get">;
export type DocumentDto = DocumentListDto[number];
export type InfoRequestListDto = ApiResponse<"/cases/{id}/information-requests", "get">;
export type InfoRequestDto = InfoRequestListDto[number];
export type AuditListDto = ApiResponse<"/audit", "get">;

export type SlaComplianceReportDto = ApiResponse<"/reports/sla-compliance", "get">;
export type AgeingReportDto = ApiResponse<"/reports/ageing", "get">;
export type VolumeByCategoryReportDto = ApiResponse<"/reports/volume-by-category", "get">;
export type VolumeByOrganisationReportDto = ApiResponse<"/reports/volume-by-organisation", "get">;
export type RepWorkloadReportDto = ApiResponse<"/reports/rep-workload", "get">;

export type CaseCategoryListDto = ApiResponse<"/case-categories", "get">;
export type CaseTypeListDto = ApiResponse<"/case-types", "get">;
export type DepartmentListDto = ApiResponse<"/departments", "get">;
export type EntityListDto = ApiResponse<"/entities", "get">;
export type BusinessUnitListDto = ApiResponse<"/business-units", "get">;
export type ClosureOutcomeListDto = ApiResponse<"/closure-outcomes", "get">;
export type CaseCategoryDto = CaseCategoryListDto[number];
export type CaseTypeDto = CaseTypeListDto[number];
export type DepartmentDto = DepartmentListDto[number];
export type EntityDto = EntityListDto[number];
export type BusinessUnitDto = BusinessUnitListDto[number];
export type ClosureOutcomeDto = ClosureOutcomeListDto[number];
export type RoutingRuleListDto = ApiResponse<"/routing-rules", "get">;
export type RoutingRuleDto = RoutingRuleListDto[number];
