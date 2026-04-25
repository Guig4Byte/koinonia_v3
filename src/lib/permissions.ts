import type { AppRole } from "@/types";

/**
 * Matriz RBAC centralizada do Koinonia.
 *
 * Formato: resource:action:scope
 * - resource: group | person | event | task | interaction | attendance
 * - action: read | write
 * - scope: all | own | self
 *
 * "own" = scoped ao grupo/célula do usuário (supervisor → suas células, líder → sua célula)
 * "self" = apenas o próprio perfil
 */
export const ROLE_PERMISSIONS: Record<AppRole, readonly string[]> = {
  pastor: [
    "group:read:all",
    "group:write:all",
    "person:read:all",
    "person:write:all",
    "event:read:all",
    "event:write:all",
    "attendance:read:all",
    "attendance:write:all",
    "task:read:all",
    "task:write:all",
    "interaction:read:all",
    "interaction:write:all",
  ],
  supervisor: [
    "group:read:own",
    "group:write:own",
    "person:read:own",
    "person:write:own",
    "event:read:own",
    "event:write:own",
    "attendance:read:own",
    "task:read:own",
    "task:write:own",
    "interaction:read:own",
    "interaction:write:own",
  ],
  leader: [
    "group:read:own",
    "group:write:attendance:own",
    "person:read:own",
    "person:write:own",
    "event:read:own",
    "event:write:attendance:own",
    "attendance:read:own",
    "attendance:write:own",
    "task:read:own",
    "interaction:read:own",
    "interaction:write:own",
  ],
  host: [],
  member: ["person:read:self"],
};

/**
 * Verifica se uma role possui uma permissão específica.
 */
export function hasPermission(role: AppRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Verifica se uma role possui qualquer permissão que comece com o prefixo dado.
 * Útil para verificar "group:read:*" sem especificar o scope exato.
 */
export function hasPermissionPrefix(role: AppRole, prefix: string): boolean {
  return ROLE_PERMISSIONS[role].some((p) => p.startsWith(prefix));
}
