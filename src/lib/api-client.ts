import type { ApiErrorResponse, RefreshTokenResponse } from "@/types";
import {
  clearStoredAuth,
  getStoredAccessToken,
  updateStoredAccessToken,
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

// --- Refresh token centralizado com mutex para evitar race conditions ---

let refreshPromise: Promise<RefreshTokenResponse> | null = null;

async function performRefresh(): Promise<RefreshTokenResponse> {
  const response = await apiRequest<RefreshTokenResponse>("/api/auth/refresh", {
    method: "POST",
    credentials: "same-origin",
  });

  updateStoredAccessToken(response.accessToken);

  return response;
}

async function refreshTokenWithLock(): Promise<RefreshTokenResponse> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = performRefresh().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function refreshStoredSession(): Promise<RefreshTokenResponse> {
  try {
    return await refreshTokenWithLock();
  } catch (error) {
    clearStoredAuth();
    throw error;
  }
}

function buildAuthHeaders(init: RequestInit | undefined, accessToken: string): Headers {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  return headers;
}

async function getUsableAccessToken(): Promise<string> {
  const accessToken = getStoredAccessToken();

  if (accessToken) {
    return accessToken;
  }

  const refreshedSession = await refreshStoredSession();
  return refreshedSession.accessToken;
}

/**
 * Faz requisições autenticadas automaticamente.
 *
 * - Injeta o header Authorization com o access token atual
 * - Se não houver access token, tenta renovar usando o refresh token em cookie HttpOnly
 * - Se receber 401/TOKEN_EXPIRED, tenta renovar o token e re-executa a chamada
 * - Se o refresh falhar, limpa a sessão e propaga o erro
 * - Usa mutex para evitar múltiplos refreshes paralelos
 */
export async function apiRequestWithAuth<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const accessToken = await getUsableAccessToken();

  const authedInit: RequestInit = {
    ...init,
    headers: buildAuthHeaders(init, accessToken),
  };

  try {
    return await apiRequest<T>(input, authedInit);
  } catch (error) {
    if (isApiClientError(error) && error.code === "TOKEN_EXPIRED") {
      const refreshedSession = await refreshStoredSession();

      const retriedInit: RequestInit = {
        ...init,
        headers: buildAuthHeaders(init, refreshedSession.accessToken),
      };

      return apiRequest<T>(input, retriedInit);
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
