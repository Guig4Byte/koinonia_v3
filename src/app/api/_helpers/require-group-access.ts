import { prisma } from "@/lib/prisma";
import { forbiddenResponse, serverErrorResponse } from "@/lib/api-response";
import { hasPermission } from "@/lib/permissions";

export interface AuthContext {
  userId: string;
  role: string;
  personId: string;
  churchId: string;
}

/**
 * Verifica se o usuário logado tem permissão para acessar um grupo específico.
 *
 * Regras (matriz RBAC):
 * - pastor: acesso a todos os grupos da igreja (group:read:all)
 * - supervisor: acesso aos grupos onde é supervisor (group:read:own)
 * - leader: acesso aos grupos onde é líder (group:read:own)
 * - host/member: sem acesso
 */
export async function requireGroupAccess(
  auth: AuthContext,
  groupId: string,
): Promise<{ ok: true } | { ok: false; response: Response }> {
  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId, deletedAt: null },
      select: { churchId: true, leaderId: true, supervisorId: true },
    });

    if (!group) {
      return { ok: false, response: forbiddenResponse("GRUPO_NAO_ENCONTRADO") };
    }

    if (group.churchId !== auth.churchId) {
      return { ok: false, response: forbiddenResponse("IGREJA_DIFERENTE") };
    }

    const role = auth.role as import("@/types").AppRole;

    if (hasPermission(role, "group:read:all")) {
      return { ok: true };
    }

    if (hasPermission(role, "group:read:own")) {
      if (role === "supervisor" && group.supervisorId === auth.userId) {
        return { ok: true };
      }
      if (role === "leader" && group.leaderId === auth.userId) {
        return { ok: true };
      }
    }

    return { ok: false, response: forbiddenResponse("SEM_PERMISSAO") };
  } catch {
    return { ok: false, response: serverErrorResponse() };
  }
}
