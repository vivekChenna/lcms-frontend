import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiJson } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { ApiBody, BusinessUnitDto, CaseTypeDto, EntityDto } from "@/lib/api/types";
import { qk } from "@/lib/queries/keys";

function onErrorToast(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : "The request could not be completed.");
}

export type SimpleResource = "departments" | "case-categories" | "closure-outcomes";

const SIMPLE_LOOKUP_KEY: Record<SimpleResource, readonly string[]> = {
  departments: qk.departments,
  "case-categories": qk.categories,
  "closure-outcomes": qk.closureOutcomes,
};

/** Departments, case categories and closure outcomes all share the same {name, isActive}
 * create/rename/activate shape (registerSimpleMasterDataResource on the backend). */
export function useCreateSimpleResource(resource: SimpleResource) {
  const qc = useQueryClient();
  return useMutation<{ id: string; name: string; isActive: boolean }, ApiError, string>({
    mutationFn: (name: string) => apiJson(`/${resource}`, { method: "POST", json: { name } }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: SIMPLE_LOOKUP_KEY[resource] });
      toast.success("Created");
    },
    onError: onErrorToast,
  });
}

export function useUpdateSimpleResource(resource: SimpleResource) {
  const qc = useQueryClient();
  return useMutation<
    { id: string; name: string; isActive: boolean },
    ApiError,
    { id: string; name?: string; isActive?: boolean }
  >({
    mutationFn: ({ id, ...body }) => apiJson(`/${resource}/${id}`, { method: "PATCH", json: body }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: SIMPLE_LOOKUP_KEY[resource] });
      toast.success("Updated");
    },
    onError: onErrorToast,
  });
}

type CreateEntityBody = ApiBody<"/entities", "post">;
type UpdateEntityBody = ApiBody<"/entities/{id}", "patch">;

export function useCreateEntity() {
  const qc = useQueryClient();
  return useMutation<EntityDto, ApiError, CreateEntityBody>({
    mutationFn: (body) => apiJson<EntityDto>("/entities", { method: "POST", json: body }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.entities });
      toast.success("Entity created");
    },
    onError: onErrorToast,
  });
}

export function useUpdateEntity(id: string) {
  const qc = useQueryClient();
  return useMutation<EntityDto, ApiError, UpdateEntityBody>({
    mutationFn: (body) => apiJson<EntityDto>(`/entities/${id}`, { method: "PATCH", json: body }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.entities });
      toast.success("Entity updated");
    },
    onError: onErrorToast,
  });
}

type CreateBusinessUnitBody = ApiBody<"/business-units", "post">;
type UpdateBusinessUnitBody = ApiBody<"/business-units/{id}", "patch">;

export function useCreateBusinessUnit() {
  const qc = useQueryClient();
  return useMutation<BusinessUnitDto, ApiError, CreateBusinessUnitBody>({
    mutationFn: (body) =>
      apiJson<BusinessUnitDto>("/business-units", { method: "POST", json: body }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.businessUnits });
      toast.success("Business unit created");
    },
    onError: onErrorToast,
  });
}

export function useUpdateBusinessUnit(id: string) {
  const qc = useQueryClient();
  return useMutation<BusinessUnitDto, ApiError, UpdateBusinessUnitBody>({
    mutationFn: (body) =>
      apiJson<BusinessUnitDto>(`/business-units/${id}`, { method: "PATCH", json: body }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.businessUnits });
      toast.success("Business unit updated");
    },
    onError: onErrorToast,
  });
}

type CreateCaseTypeBody = ApiBody<"/case-types", "post">;
type UpdateCaseTypeBody = ApiBody<"/case-types/{id}", "patch">;

export function useCreateCaseType() {
  const qc = useQueryClient();
  return useMutation<CaseTypeDto, ApiError, CreateCaseTypeBody>({
    mutationFn: (body) => apiJson<CaseTypeDto>("/case-types", { method: "POST", json: body }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.caseTypes });
      toast.success("Case type created");
    },
    onError: onErrorToast,
  });
}

export function useUpdateCaseTypeMasterData(id: string) {
  const qc = useQueryClient();
  return useMutation<CaseTypeDto, ApiError, UpdateCaseTypeBody>({
    mutationFn: (body) =>
      apiJson<CaseTypeDto>(`/case-types/${id}`, { method: "PATCH", json: body }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.caseTypes });
      toast.success("Case type updated");
    },
    onError: onErrorToast,
  });
}
