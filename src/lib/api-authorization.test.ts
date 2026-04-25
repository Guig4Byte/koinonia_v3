// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  API_ROUTE_AUTHORIZATION,
  canAccessApiRoute,
  type ApiRouteKey,
} from "./api-authorization";
import type { CurrentUser } from "./get-current-user";
import type { AppRole } from "@/types";

function userWithRole(role: AppRole): CurrentUser {
  return {
    userId: `user-${role}`,
    role,
    personId: `person-${role}`,
    churchId: "church-1",
  };
}

describe("API_ROUTE_AUTHORIZATION", () => {
  it("mantém rotas administrativas de pastor restritas ao pastor", () => {
    const pastorOnlyRoutes: ApiRouteKey[] = [
      "pastor:dashboard",
      "pastor:search",
      "pastor:supervisors",
      "people:search",
    ];

    for (const route of pastorOnlyRoutes) {
      expect(API_ROUTE_AUTHORIZATION[route]).toEqual(["pastor"]);
      expect(canAccessApiRoute(userWithRole("pastor"), route)).toBe(true);
      expect(canAccessApiRoute(userWithRole("supervisor"), route)).toBe(false);
      expect(canAccessApiRoute(userWithRole("leader"), route)).toBe(false);
      expect(canAccessApiRoute(userWithRole("member"), route)).toBe(false);
    }
  });

  it("mantém rotas de líder restritas ao líder", () => {
    const leaderOnlyRoutes: ApiRouteKey[] = [
      "leader:dashboard",
      "leader:events",
      "leader:attendance:read",
      "leader:members",
      "leader:tasks",
    ];

    for (const route of leaderOnlyRoutes) {
      expect(API_ROUTE_AUTHORIZATION[route]).toEqual(["leader"]);
      expect(canAccessApiRoute(userWithRole("leader"), route)).toBe(true);
      expect(canAccessApiRoute(userWithRole("pastor"), route)).toBe(false);
      expect(canAccessApiRoute(userWithRole("supervisor"), route)).toBe(false);
      expect(canAccessApiRoute(userWithRole("member"), route)).toBe(false);
    }
  });

  it("permite criação pastoral apenas para papéis com contexto de cuidado", () => {
    expect(canAccessApiRoute(userWithRole("pastor"), "interactions:create")).toBe(true);
    expect(canAccessApiRoute(userWithRole("supervisor"), "interactions:create")).toBe(true);
    expect(canAccessApiRoute(userWithRole("leader"), "interactions:create")).toBe(true);
    expect(canAccessApiRoute(userWithRole("host"), "interactions:create")).toBe(false);
    expect(canAccessApiRoute(userWithRole("member"), "interactions:create")).toBe(false);
  });

  it("não autoriza papéis desconhecidos", () => {
    const unknownUser: CurrentUser = {
      userId: "u1",
      role: "admin",
      personId: "p1",
      churchId: "c1",
    };

    expect(canAccessApiRoute(unknownUser, "pastor:dashboard")).toBe(false);
    expect(canAccessApiRoute(unknownUser, "members:read")).toBe(false);
  });
});
