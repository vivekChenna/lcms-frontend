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

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => apiJson<unknown>("/auth/logout", { method: "POST" }),
    onSettled: () => {
      queryClient.clear();
      void navigate({ to: "/login" });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: ApiBody<"/auth/change-password", "post">) =>
      apiJson<unknown>("/auth/change-password", { method: "POST", json: body }),
  });
}
