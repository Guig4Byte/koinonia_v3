import type { ApiErrorResponse } from "@/types";

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
