import { prisma } from "@/lib/prisma";
import type { AuditAction, AuditResource } from "@prisma/client";

export interface AuditLogInput {
  userId?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string;
  details?: string;
  ip?: string | null;
}

/**
 * Grava um registro de auditoria de forma fire-and-forget.
 * Nunca bloqueia a resposta da API principal.
 */
export function writeAuditLog(input: AuditLogInput): void {
  // Fire-and-forget: não usamos await aqui
  prisma.auditLog
    .create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        details: input.details ?? null,
        ip: input.ip ?? null,
      },
    })
    .catch(() => {
      // Silencioso: falha de audit não deve quebrar a API
    });
}

/**
 * Helper para extrair IP da request (suporta proxies).
 */
export function extractIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }
  return request.headers.get("x-real-ip");
}
