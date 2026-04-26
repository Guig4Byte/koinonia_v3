import type { AppRole } from "@/types"

export const ROLE_HOME_PATH: Record<AppRole, string> = {
  pastor: "/pastor",
  supervisor: "/supervisor",
  leader: "/lider",
  host: "/anfitriao",
  member: "/membro",
}

export function getRoleHomePath(role?: string | null) {
  if (!role) return "/login"

  return ROLE_HOME_PATH[role as AppRole] ?? "/login"
}
