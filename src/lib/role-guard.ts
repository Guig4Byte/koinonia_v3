import { DomainErrors } from "@/domain/errors/domain-errors";
import type { AppRole } from "@/types";

export function requireRole(
  userRole: string,
  allowedRoles: readonly AppRole[],
):
  | { authorized: true }
  | { authorized: false; error: typeof DomainErrors.UNAUTHORIZED } {
  if (allowedRoles.includes(userRole as AppRole)) {
    return { authorized: true };
  }
  return { authorized: false, error: DomainErrors.UNAUTHORIZED };
}
