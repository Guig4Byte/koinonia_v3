import { prisma } from "@/lib/prisma";
import type { AuditAction, AuditResource, Prisma } from "@prisma/client";

export interface AuditLogInput {
  userId: string;
  churchId: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string;
  details?: string | null;
  ip?: string | null;
}

type AuditClient = typeof prisma | Prisma.TransactionClient;

/**
 * Grava um registro de auditoria de forma durável.
 *
 * Importante:
 * - não usa "fire and forget";
 * - não engole erro;
 * - quem chama precisa dar await.
 *
 * Assim, leituras e alterações sensíveis não são consideradas concluídas
 * se o registro de auditoria falhar.
 */
export async function writeAuditLog(
  input: AuditLogInput,
  client: AuditClient = prisma,
): Promise<void> {
  await client.auditLog.create({
    data: {
      userId: input.userId,
      churchId: input.churchId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      details: input.details ?? null,
      ip: input.ip ?? null,
    },
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
