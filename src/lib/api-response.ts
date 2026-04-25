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
  TASK_NOT_FOUND: 404,
  INVALID_ATTENDEES: 400,
  INVALID_TASK_TARGET: 400,
};

const domainMessageMap: Record<DomainError, string> = {
  PERSON_NOT_FOUND: "Pessoa não encontrada.",
  GROUP_NOT_FOUND: "Célula não encontrada.",
  EVENT_NOT_FOUND: "Evento não encontrado.",
  USER_NOT_FOUND: "Usuário não encontrado.",
  UNAUTHORIZED: "Você precisa estar autenticado para continuar.",
  FORBIDDEN: "Você não tem permissão para concluir esta ação.",
  INVALID_ROLE: "A role informada não é válida.",
  INVALID_CREDENTIALS: "E-mail ou senha inválidos.",
  TOKEN_EXPIRED: "Sua sessão expirou. Entre novamente.",
  TOKEN_INVALID: "O token informado é inválido.",
  REFRESH_TOKEN_INVALID: "O refresh token informado é inválido.",
  CHURCH_NOT_FOUND: "Igreja não encontrada.",
  USER_ALREADY_EXISTS: "Já existe um usuário com esses dados.",
  EMAIL_ALREADY_EXISTS: "Já existe um usuário com este e-mail.",
  TASK_NOT_FOUND: "Ação não encontrada.",
  INVALID_ATTENDEES: "Um ou mais membros não pertencem ao grupo deste evento.",
  INVALID_TASK_TARGET: "O alvo da tarefa não é válido.",
};

export function validationErrorResponse(error: ZodError) {
  return NextResponse.json<ApiErrorResponse<"VALIDATION_ERROR">>(
    {
      error: "VALIDATION_ERROR",
      message: "Os dados enviados são inválidos.",
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
      message: "Não foi possível concluir a solicitação agora.",
    },
    { status: 500 },
  );
}

export function forbiddenResponse(message?: string) {
  return NextResponse.json<ApiErrorResponse<"FORBIDDEN">>(
    {
      error: "FORBIDDEN",
      message: message ?? "Você não tem permissão para concluir esta ação.",
    },
    { status: 403 },
  );
}

export function invalidJsonResponse() {
  return NextResponse.json<ApiErrorResponse<"VALIDATION_ERROR">>(
    {
      error: "VALIDATION_ERROR",
      message: "O corpo da requisição precisa ser um JSON válido.",
    },
    { status: 400 },
  );
}

export { DomainErrors };
