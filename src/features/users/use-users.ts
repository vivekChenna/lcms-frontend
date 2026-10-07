import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiJson } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { ApiBody, UserDto, UserListDto, UserRole } from "@/lib/api/types";
import { qk } from "@/lib/queries/keys";

export type UsersFilters = {
  search?: string | undefined;
  role?: UserRole | undefined;
  isActive?: boolean | undefined;
  page: number;
};

function onErrorToast(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : "The request could not be completed.");
}

function invalidateUsers(qc: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ["users"] }),
    qc.invalidateQueries({ queryKey: qk.legalReps }),
  ]);
}

export function useUsers(filters: UsersFilters) {
  const qsParams = new URLSearchParams();
  qsParams.set("page", String(filters.page));
  qsParams.set("pageSize", "20");
  if (filters.search) qsParams.set("search", filters.search);
  if (filters.role) qsParams.set("role", filters.role);
  if (filters.isActive !== undefined) qsParams.set("isActive", String(filters.isActive));
  return useQuery({
    queryKey: qk.users(filters),
    queryFn: () => apiJson<UserListDto>(`/users?${qsParams.toString()}`),
  });
}

type CreateBody = ApiBody<"/users", "post">;

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation<UserDto, ApiError, CreateBody>({
    mutationFn: (body: CreateBody) => apiJson<UserDto>("/users", { method: "POST", json: body }),
    onSuccess: async () => {
      await invalidateUsers(qc);
      toast.success("User created");
    },
    onError: onErrorToast,
  });
}

type UpdateBody = ApiBody<"/users/{id}", "patch">;

export function useUpdateUser(userId: string) {
  const qc = useQueryClient();
  return useMutation<UserDto, ApiError, UpdateBody>({
    mutationFn: (body: UpdateBody) =>
      apiJson<UserDto>(`/users/${userId}`, { method: "PATCH", json: body }),
    onSuccess: async () => {
      await invalidateUsers(qc);
      toast.success("User updated");
    },
    onError: onErrorToast,
  });
}

export function useChangeRole(userId: string) {
  const qc = useQueryClient();
  return useMutation<UserDto, ApiError, UserRole>({
    mutationFn: (role: UserRole) =>
      apiJson<UserDto>(`/users/${userId}/role`, { method: "PATCH", json: { role } }),
    onSuccess: async () => {
      await invalidateUsers(qc);
      toast.success("Role updated");
    },
    onError: onErrorToast,
  });
}

export function useSetActive(userId: string) {
  const qc = useQueryClient();
  return useMutation<UserDto, ApiError, boolean>({
    mutationFn: (active: boolean) =>
      apiJson<UserDto>(`/users/${userId}/${active ? "activate" : "deactivate"}`, {
        method: "PATCH",
      }),
    onSuccess: async (_data, active) => {
      await invalidateUsers(qc);
      toast.success(active ? "User activated" : "User deactivated");
    },
    onError: onErrorToast,
  });
}

export function useResetPassword(userId: string) {
  return useMutation<unknown, ApiError, string>({
    mutationFn: (newPassword: string) =>
      apiJson<unknown>(`/users/${userId}/reset-password`, {
        method: "PATCH",
        json: { newPassword },
      }),
    onSuccess: () => toast.success("Password reset"),
    onError: onErrorToast,
  });
}
