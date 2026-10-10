import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { apiJson } from "@/lib/api/client";
import type { ApiBody, LoginResponse, Profile } from "@/lib/api/types";

// Session = GET /auth/me. Tokens live only in HttpOnly cookies; the JSON token fields are ignored.
export const meQueryOptions = () =>
  queryOptions({
    queryKey: ["me"],
    queryFn: () => apiJson<Profile>("/auth/me"),
    staleTime: 60_000,
    retry: false,
  });

export function useMe(): Profile | undefined {
  return useQuery(meQueryOptions()).data;
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ApiBody<"/auth/login", "post">) =>
      apiJson<LoginResponse>("/auth/login", { method: "POST", json: body }),
    onSuccess: (data) => {
      // never show another user's cached data; the login `user` is a full Profile
      queryClient.clear();
      queryClient.setQueryData(meQueryOptions().queryKey, data.user);
    },
  });
}

/** One-time message the login page shows after a forced sign-out. */
export type LoginNotice = "password-changed" | "password-set";

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (_?: { notice?: LoginNotice }) =>
      apiJson<unknown>("/auth/logout", { method: "POST" }),
    onSettled: (_data, _error, vars) => {
      queryClient.clear();
      void navigate({ to: "/login", search: vars?.notice ? { notice: vars.notice } : {} });
    },
  });
}

/** Public: spend the emailed one-time token to choose a password. */
export function useSetPassword() {
  return useMutation({
    mutationFn: (body: ApiBody<"/auth/set-password", "post">) =>
      apiJson<unknown>("/auth/set-password", { method: "POST", json: body }),
  });
}

/** Public: ask for a link. The server answers the same way whether or not the account exists. */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (body: ApiBody<"/auth/forgot-password", "post">) =>
      apiJson<unknown>("/auth/forgot-password", { method: "POST", json: body }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: ApiBody<"/auth/change-password", "post">) =>
      apiJson<unknown>("/auth/change-password", { method: "POST", json: body }),
  });
}
