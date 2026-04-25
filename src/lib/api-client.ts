import type { ApiErrorResponse, RefreshTokenResponse } from "@/types";
import {
  clearStoredAuth,
  getStoredAccessToken,
  getStoredRefreshToken,
  updateStoredAccessToken,
  updateStoredRefreshToken,
} from "@/lib/auth-storage";

export class ApiClientError<ErrorCode extends string = string> extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly issues: string[] | undefined;

  constructor({
    status,
    code,
    message,
    issues,
  }: {
    status: number;
    code: ErrorCode;
    message: string;
    issues?: string[];
  }) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.issues = issues;
  }
}

async function readResponseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export async function apiRequest<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    let payload: ApiErrorResponse | null = null;

    try {
      payload = await readResponseJson<ApiErrorResponse>(response);
    } catch {
      payload = null;
    }

    throw new ApiClientError({
      status: response.status,
      code: payload?.error ?? "INTERNAL_SERVER_ERROR",
      message: payload?.message ?? "Nao foi possivel concluir a solicitacao.",
      ...(payload?.issues ? { issues: payload.issues } : {}),
    });
  }

  return readResponseJson<T>(response);
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

// --- Refresh token com mutex para evitar race conditions ---

let refreshPromise: Promise<void> | null = null;

async function performRefresh(): Promise<void> {
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    clearStoredAuth();
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
    body: JSON.stringify({ refreshToken }),
  });

  updateStoredAccessToken(response.accessToken);
  updateStoredRefreshToken(response.refreshToken);
}

async function refreshTokenWithLock(): Promise<void> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = performRefresh().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

/**
 * Faz requisições autenticadas automaticamente.
 *
 * - Injeta o header Authorization com o access token atual
 * - Se receber 401/TOKEN_EXPIRED, tenta renovar o token e re-executa a chamada
 * - Se o refresh falhar, limpa a sessão e propaga o erro
 * - Usa mutex para evitar múltiplos refreshes paralelos
 */
export async function apiRequestWithAuth<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const accessToken = getStoredAccessToken();

  if (!accessToken) {
    throw new ApiClientError({
      status: 401,
      code: "TOKEN_INVALID",
      message: "Você precisa entrar para continuar.",
    });
  }

  const authedInit: RequestInit = {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  };

  try {
    return await apiRequest<T>(input, authedInit);
  } catch (error) {
    if (isApiClientError(error) && error.code === "TOKEN_EXPIRED") {
      try {
        await refreshTokenWithLock();
        const newToken = getStoredAccessToken();

        if (!newToken) {
          throw new ApiClientError({
            status: 401,
            code: "TOKEN_INVALID",
            message: "Você precisa entrar para continuar.",
          });
        }

        const retriedInit: RequestInit = {
          ...init,
          headers: {
            ...init?.headers,
            Authorization: `Bearer ${newToken}`,
          },
        };

        return await apiRequest<T>(input, retriedInit);
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
}
