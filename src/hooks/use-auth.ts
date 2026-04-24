"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { startTransition, useSyncExternalStore } from "react";
import type { LoginInput, OnboardingInput } from "@/lib/validations/auth";
import { apiRequest, ApiClientError, isApiClientError } from "@/lib/api-client";
import {
  clearStoredAuth,
  getStoredAccessToken,
  getStoredRefreshToken,
  hasStoredSession,
  persistAuthTokens,
  subscribeToAuthStorage,
  updateStoredAccessToken,
} from "@/lib/auth-storage";
import type {
  LoginResponse,
  MeResponse,
  OnboardingResponse,
  RefreshTokenResponse,
} from "@/types";

export const authQueryKey = ["auth", "me"] as const;

async function requestCurrentUser(accessToken: string) {
  return apiRequest<MeResponse>("/api/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

async function refreshAccessTokenFromStorage() {
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    throw new ApiClientError({
      status: 401,
      code: "REFRESH_TOKEN_INVALID",
      message: "Sua sessão não pode ser renovada.",
    });
  }

  const response = await apiRequest<RefreshTokenResponse>("/api/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refreshToken,
    }),
  });

  updateStoredAccessToken(response.accessToken);
  return response.accessToken;
}

export function useStoredSessionState() {
  const isHydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const storedSession = useSyncExternalStore(
    subscribeToAuthStorage,
    () => hasStoredSession(),
    () => false,
  );

  return {
    isHydrated,
    hasSession: isHydrated && storedSession,
  };
}

export function useMe(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: authQueryKey,
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const accessToken = getStoredAccessToken();

      if (!accessToken) {
        throw new ApiClientError({
          status: 401,
          code: "TOKEN_INVALID",
          message: "Você precisa entrar para continuar.",
        });
      }

      try {
        const response = await requestCurrentUser(accessToken);
        return response.user;
      } catch (error) {
        if (isApiClientError(error) && error.code === "TOKEN_EXPIRED") {
          try {
            const renewedAccessToken = await refreshAccessTokenFromStorage();
            const retriedResponse = await requestCurrentUser(renewedAccessToken);
            return retriedResponse.user;
          } catch (refreshError) {
            clearStoredAuth();
            throw refreshError;
          }
        }

        if (
          isApiClientError(error) &&
          (error.code === "TOKEN_INVALID" || error.code === "REFRESH_TOKEN_INVALID")
        ) {
          clearStoredAuth();
        }

        throw error;
      }
    },
  });
}

export function useLogin(options?: { redirectTo?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiRequest<LoginResponse>("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      }),
    onSuccess: (response) => {
      persistAuthTokens(response);
      queryClient.clear(); // Limpa cache de usuário anterior
      queryClient.setQueryData(authQueryKey, response.user);

      const redirectTo = options?.redirectTo;
      const role = response.user.role;
      const defaultRoute =
        role === "pastor" ? "/pastor" :
        role === "supervisor" ? "/supervisor" :
        role === "leader" ? "/lider" : "/";
      startTransition(() => {
        router.replace(redirectTo ?? defaultRoute);
      });
    },
    onError: (error) => {
      console.error("[useLogin] onError", error);
    },
  });
}

export function useOnboarding(options?: { redirectTo?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: OnboardingInput) =>
      apiRequest<OnboardingResponse>("/api/auth/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      }),
    onSuccess: (response) => {
      persistAuthTokens(response);
      queryClient.clear(); // Limpa cache de usuário anterior
      queryClient.setQueryData(authQueryKey, response.user);

      const redirectTo = options?.redirectTo;
      const role = response.user.role;
      const defaultRoute =
        role === "pastor" ? "/pastor" :
        role === "supervisor" ? "/supervisor" :
        role === "leader" ? "/lider" : "/";
      startTransition(() => {
        router.replace(redirectTo ?? defaultRoute);
      });
    },
    onError: (error) => {
      console.error("[useOnboarding] onError", error);
    },
  });
}

export function useRefreshToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (refreshToken?: string) => {
      const selectedRefreshToken = refreshToken ?? getStoredRefreshToken();

      if (!selectedRefreshToken) {
        throw new ApiClientError({
          status: 401,
          code: "REFRESH_TOKEN_INVALID",
          message: "Sua sessão não pode ser renovada.",
        });
      }

      const response = await apiRequest<RefreshTokenResponse>("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken: selectedRefreshToken,
        }),
      });

      updateStoredAccessToken(response.accessToken);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authQueryKey });
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return async () => {
    const refreshToken = getStoredRefreshToken();

    if (refreshToken) {
      try {
        await apiRequest("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Ignora erro de logout no servidor — logout local sempre deve funcionar
      }
    }

    clearStoredAuth();
    queryClient.clear(); // Limpa TODO o cache, não só auth

    startTransition(() => {
      router.replace("/login");
    });
  };
}
