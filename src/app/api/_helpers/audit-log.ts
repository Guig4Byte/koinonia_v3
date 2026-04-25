import { prisma } from "@/lib/prisma";
import type { AuditAction, AuditResource } from "@prisma/client";

export interface AuditLogInput {
  userId?: string;
  churchId?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string;
  details?: string;
  ip?: string | null;
}

const AUDIT_TIMEOUT_MS = 500;

/**
 * Grava um registro de auditoria de forma durável.
 * Usa timeout curto para não bloquear a resposta da API principal.
 * Falhas são logadas no stderr.
 */
export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  const timeout = new Promise<void>((_, reject) => {
    setTimeout(() => reject(new Error("Audit log timeout")), AUDIT_TIMEOUT_MS);
  });

  const write = prisma.auditLog
    .create({
      data: {
        userId: input.userId ?? null,
        churchId: input.churchId ?? null,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        details: input.details ?? null,
        ip: input.ip ?? null,
      },
    })
    .then(() => undefined)
    .catch((error: unknown) => {
      console.error("[AUDIT] Falha ao gravar log:", error);
      throw error;
    });

  try {
    await Promise.race([write, timeout]);
  } catch {
    // Falha de audit não quebra a API, mas já foi logada no stderr
  }
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
