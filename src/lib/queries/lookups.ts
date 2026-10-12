import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiJson } from "@/lib/api/client";
import type {
  BusinessUnitListDto,
  CaseCategoryListDto,
  CaseTypeListDto,
  CaseHolderListDto,
  ClosureOutcomeListDto,
  DepartmentListDto,
  EntityListDto,
  UserDto,
  UserListDto,
} from "@/lib/api/types";
import { useMe } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { qk } from "./keys";

const STALE = 5 * 60_000;

const lookup = <T>(queryKey: readonly string[], path: string) =>
  queryOptions({ queryKey, queryFn: () => apiJson<T>(path), staleTime: STALE });

export const useCategories = () =>
  useQuery(lookup<CaseCategoryListDto>(qk.categories, "/case-categories"));
export const useCaseTypes = () => useQuery(lookup<CaseTypeListDto>(qk.caseTypes, "/case-types"));
export const useDepartments = () =>
  useQuery(lookup<DepartmentListDto>(qk.departments, "/departments"));
export const useEntities = () => useQuery(lookup<EntityListDto>(qk.entities, "/entities"));
export const useBusinessUnits = () =>
  useQuery(lookup<BusinessUnitListDto>(qk.businessUnits, "/business-units"));
export const useClosureOutcomes = () =>
  useQuery(lookup<ClosureOutcomeListDto>(qk.closureOutcomes, "/closure-outcomes"));

/** Active legal reps for the assign picker; only roles that can assign ever request it. */
export function useLegalReps() {
  const me = useMe();
  return useQuery({
    queryKey: qk.legalReps,
    queryFn: () => apiJson<UserListDto>("/users?role=legal_rep&isActive=true&pageSize=100"),
    select: (page): UserDto[] => page.items,
    staleTime: STALE,
    enabled: !!me && can.assign(me.role),
  });
}

/** Everyone who can hold a case, for the Cases "Legal representative" filter; open to every role. */
export const useCaseHolders = () =>
  useQuery(lookup<CaseHolderListDto>(qk.caseHolders, "/case-holders"));

/** Display name for a lookup id; "—" when the id or list is missing or unknown. */
export function nameOf(
  list: readonly { id: string; name: string }[] | undefined,
  id: string | null | undefined,
): string {
  return (id && list?.find((x) => x.id === id)?.name) || "—";
}
