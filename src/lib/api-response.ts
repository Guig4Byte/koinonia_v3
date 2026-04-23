import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { DomainErrors, type DomainError } from "@/domain/errors/domain-errors";
import type { ApiErrorResponse } from "@/types";

const domainStatusMap: Record<DomainError, number> = {
  PERSON_NOT_FOUND: 404,
  GROUP_NOT_FOUND: 404,
  EVENT_NOT_FOUND: 404,
  USER_NOT_FOUND: 401,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  INVALID_ROLE: 400,
  INVALID_CREDENTIALS: 401,
  TOKEN_EXPIRED: 401,
  TOKEN_INVALID: 401,
  REFRESH_TOKEN_INVALID: 401,
  CHURCH_NOT_FOUND: 404,
  USER_ALREADY_EXISTS: 409,
  EMAIL_ALREADY_EXISTS: 409,
};

const domainMessageMap: Record<DomainError, string> = {
  PERSON_NOT_FOUND: "Pessoa nao encontrada.",
  GROUP_NOT_FOUND: "Celula nao encontrada.",
  EVENT_NOT_FOUND: "Evento nao encontrado.",
  USER_NOT_FOUND: "Usuario nao encontrado.",
  UNAUTHORIZED: "Voce precisa estar autenticado para continuar.",
  FORBIDDEN: "Voce nao tem permissao para concluir esta acao.",
  INVALID_ROLE: "A role informada nao e valida.",
  INVALID_CREDENTIALS: "Email ou senha invalidos.",
  TOKEN_EXPIRED: "Sua sessao expirou. Entre novamente.",
  TOKEN_INVALID: "O token informado e invalido.",
  REFRESH_TOKEN_INVALID: "O refresh token informado e invalido.",
  CHURCH_NOT_FOUND: "Igreja nao encontrada.",
  USER_ALREADY_EXISTS: "Ja existe um usuario com esses dados.",
  EMAIL_ALREADY_EXISTS: "Ja existe um usuario com este email.",
};

export function validationErrorResponse(error: ZodError) {
  return NextResponse.json<ApiErrorResponse<"VALIDATION_ERROR">>(
    {
      error: "VALIDATION_ERROR",
      message: "Os dados enviados sao invalidos.",
      issues: error.issues.map((issue) => issue.message),
    },
    { status: 400 },
  );
}

export function domainErrorResponse(error: DomainError) {
  return NextResponse.json<ApiErrorResponse<DomainError>>(
    {
      error,
      message: domainMessageMap[error],
    },
    { status: domainStatusMap[error] },
  );
}

export function serverErrorResponse() {
  return NextResponse.json<ApiErrorResponse<"INTERNAL_SERVER_ERROR">>(
    {
      error: "INTERNAL_SERVER_ERROR",
      message: "Nao foi possivel concluir a solicitacao agora.",
    },
    { status: 500 },
  );
}

export function invalidJsonResponse() {
  return NextResponse.json<ApiErrorResponse<"VALIDATION_ERROR">>(
    {
      error: "VALIDATION_ERROR",
      message: "O corpo da requisicao precisa ser um JSON valido.",
    },
    { status: 400 },
  );
}

export function unauthorizedRedirectResponse(requestUrl: string) {
  return NextResponse.redirect(new URL("/login", requestUrl));
}

export { DomainErrors };
