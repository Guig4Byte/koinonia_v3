import { prisma } from "@/lib/prisma";
import { forbiddenResponse, serverErrorResponse } from "@/lib/api-response";
import { hasPermission } from "@/lib/permissions";
import type { AuthContext } from "./require-group-access";

/**
 * Verifica se o usuário logado tem permissão para acessar um evento específico.
 *
 * Delega para requireGroupAccess usando o groupId do evento,
 * mas primeiro valida se a role tem permissão de evento.
 */
export async function requireEventAccess(
  auth: AuthContext,
  eventId: string,
): Promise<{ ok: true; groupId: string } | { ok: false; response: Response }> {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      select: { groupId: true },
    });

    if (!event) {
      return {
        ok: false,
        response: forbiddenResponse("EVENTO_NAO_ENCONTRADO"),
      };
    }

    const role = auth.role as import("@/types").AppRole;

    if (
      !hasPermission(role, "event:read:own") &&
      !hasPermission(role, "event:read:all")
    ) {
      return { ok: false, response: forbiddenResponse("SEM_PERMISSAO") };
    }

    const { requireGroupAccess } = await import("./require-group-access");
    const result = await requireGroupAccess(auth, event.groupId);

    if (!result.ok) {
      return { ok: false, response: result.response };
    }

    return { ok: true, groupId: event.groupId };
  } catch {
    return { ok: false, response: serverErrorResponse() };
  }
}
