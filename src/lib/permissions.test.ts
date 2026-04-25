import { describe, it, expect } from "vitest";
import {
  hasPermission,
  hasPermissionPrefix,
  ROLE_PERMISSIONS,
} from "./permissions";

describe("ROLE_PERMISSIONS", () => {
  it("pastor tem permissão total", () => {
    expect(ROLE_PERMISSIONS.pastor).toContain("group:read:all");
    expect(ROLE_PERMISSIONS.pastor).toContain("person:write:all");
    expect(ROLE_PERMISSIONS.pastor).toContain("task:write:all");
  });

  it("supervisor tem acesso own mas não all", () => {
    expect(ROLE_PERMISSIONS.supervisor).toContain("group:read:own");
    expect(ROLE_PERMISSIONS.supervisor).not.toContain("group:read:all");
  });

  it("líder tem acesso own mas não all", () => {
    expect(ROLE_PERMISSIONS.leader).toContain("group:read:own");
    expect(ROLE_PERMISSIONS.leader).not.toContain("group:read:all");
    expect(ROLE_PERMISSIONS.leader).toContain("attendance:write:own");
  });

  it("membro só pode ler próprio perfil", () => {
    expect(ROLE_PERMISSIONS.member).toEqual(["person:read:self"]);
  });

  it("host não tem permissões", () => {
    expect(ROLE_PERMISSIONS.host).toHaveLength(0);
  });
});

describe("hasPermission", () => {
  it("pastor pode tudo", () => {
    expect(hasPermission("pastor", "group:read:all")).toBe(true);
    expect(hasPermission("pastor", "event:write:all")).toBe(true);
  });

  it("supervisor não pode all", () => {
    expect(hasPermission("supervisor", "group:read:all")).toBe(false);
    expect(hasPermission("supervisor", "group:read:own")).toBe(true);
  });

  it("líder pode registrar presença mas não gerenciar tudo", () => {
    expect(hasPermission("leader", "attendance:write:own")).toBe(true);
    expect(hasPermission("leader", "task:write:all")).toBe(false);
  });

  it("membro só pode self", () => {
    expect(hasPermission("member", "person:read:self")).toBe(true);
    expect(hasPermission("member", "person:read:all")).toBe(false);
  });
});

describe("hasPermissionPrefix", () => {
  it("detecta prefixo de permissão", () => {
    expect(hasPermissionPrefix("pastor", "group:read:")).toBe(true);
    expect(hasPermissionPrefix("leader", "group:read:")).toBe(true);
    expect(hasPermissionPrefix("member", "group:read:")).toBe(false);
  });
});
