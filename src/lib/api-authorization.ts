import prisma from "@/lib/prisma";
import type { CurrentUser } from "@/lib/get-current-user";
import type { AppRole } from "@/types";

export type ApiRouteKey =
  | "auth:login"
  | "auth:logout"
  | "auth:me"
  | "auth:onboarding"
  | "auth:refresh"
  | "pastor:dashboard"
  | "pastor:search"
  | "pastor:supervisors"
  | "supervisor:dashboard"
  | "supervisor:groups"
  | "leader:dashboard"
  | "leader:events"
  | "leader:attendance:read"
  | "leader:members"
  | "leader:tasks"
  | "people:search"
  | "people:read"
  | "members:read"
  | "groups:read"
  | "groups:health"
  | "events:read"
  | "attendance:write"
  | "tasks:create"
  | "tasks:update"
  | "interactions:create";

/**
 * Matriz de autorização HTTP por rota/caso de uso.
 *
 * Esta matriz responde: "qual papel pode tentar acessar este endpoint?".
 * Regras contextuais continuam obrigatórias depois dela, por exemplo:
 * - pastor limitado à própria igreja;
 * - supervisor limitado às células supervisionadas;
 * - líder limitado à célula liderada;
 * - membro/host limitado ao próprio perfil quando aplicável.
 */
export const API_ROUTE_AUTHORIZATION: Record<ApiRouteKey, readonly AppRole[]> = {
  "auth:login": ["pastor", "supervisor", "leader", "host", "member"],
  "auth:logout": ["pastor", "supervisor", "leader", "host", "member"],
  "auth:me": ["pastor", "supervisor", "leader", "host", "member"],
  "auth:onboarding": ["pastor", "supervisor", "leader", "host", "member"],
  "auth:refresh": ["pastor", "supervisor", "leader", "host", "member"],

  "pastor:dashboard": ["pastor"],
  "pastor:search": ["pastor"],
  "pastor:supervisors": ["pastor"],

  "supervisor:dashboard": ["supervisor"],
  "supervisor:groups": ["supervisor"],

  "leader:dashboard": ["leader"],
  "leader:events": ["leader"],
  "leader:attendance:read": ["leader"],
  "leader:members": ["leader"],
  "leader:tasks": ["leader"],

  "people:search": ["pastor"],
  "people:read": ["pastor", "supervisor", "leader"],
  "members:read": ["pastor", "supervisor", "leader", "host", "member"],
  "groups:read": ["pastor", "supervisor", "leader"],
  "groups:health": ["pastor", "supervisor", "leader"],
  "events:read": ["pastor", "supervisor", "leader"],
  "attendance:write": ["pastor", "supervisor", "leader"],
  "tasks:create": ["pastor", "supervisor"],
  "tasks:update": ["pastor", "supervisor", "leader"],
  "interactions:create": ["pastor", "supervisor", "leader"],
};

export type PersonAccessScope = "full" | "self";

export function isAppRole(role: string): role is AppRole {
  return ["pastor", "supervisor", "leader", "host", "member"].includes(role);
}

export function canAccessApiRoute(user: CurrentUser, route: ApiRouteKey): boolean {
  if (!isAppRole(user.role)) {
    return false;
  }

  return API_ROUTE_AUTHORIZATION[route].includes(user.role);
}

export async function resolvePersonAccessScope(
  user: CurrentUser,
  personId: string,
): Promise<PersonAccessScope | null> {
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      churchId: user.churchId,
      deletedAt: null,
    },
    select: {
      id: true,
      memberships: {
        where: {
          leftAt: null,
          group: { deletedAt: null },
        },
        select: {
          group: {
            select: {
              leaderId: true,
              supervisorId: true,
            },
          },
        },
      },
    },
  });

  if (!person) {
    return null;
  }

  if (user.role === "pastor") {
    return "full";
  }

  if (
    user.role === "supervisor" &&
    person.memberships.some((membership) => membership.group.supervisorId === user.userId)
  ) {
    return "full";
  }

  if (
    user.role === "leader" &&
    person.memberships.some((membership) => membership.group.leaderId === user.userId)
  ) {
    return "full";
  }

  if (user.personId === personId) {
    return "self";
  }

  return null;
}

export async function canReadFullPersonProfile(
  user: CurrentUser,
  personId: string,
): Promise<boolean> {
  if (!canAccessApiRoute(user, "people:read")) {
    return false;
  }

  return (await resolvePersonAccessScope(user, personId)) === "full";
}

export async function canCreateInteractionForPerson(
  user: CurrentUser,
  personId: string,
): Promise<boolean> {
  if (!canAccessApiRoute(user, "interactions:create")) {
    return false;
  }

  return (await resolvePersonAccessScope(user, personId)) === "full";
}
