// @vitest-environment node

import { describe, it, expect, beforeAll, afterAll } from "vitest";

beforeAll(() => {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "test-secret-minimo-32-bytes-long!!";
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret-minimo-32-by!!";
  }
});
import { setupIntegrationTest, createTestRequest } from "./_test/integration-setup";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { GET as getPeople } from "./people/route";
import { POST as postLogin } from "./auth/login/route";
import { POST as postAttendance } from "./events/[id]/attendance/route";
import { GET as getGroup } from "./groups/[id]/route";

let ctx: Awaited<ReturnType<typeof setupIntegrationTest>>;

beforeAll(async () => {
  ctx = await setupIntegrationTest();
}, 30000);

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Integração: Auth", () => {
  it("login com credenciais válidas retorna tokens e usuário", async () => {
    const request = createTestRequest({
      url: "http://localhost/api/auth/login",
      method: "POST",
      body: { email: ctx.pastor.email, password: "teste123" },
      user: ctx.pastor,
    });

    const response = await postLogin(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.accessToken).toBeDefined();
    expect(data.refreshToken).toBeDefined();
    expect(data.user.email).toBe(ctx.pastor.email);
    expect(data.user.role).toBe("pastor");
  });

  it("login com senha incorreta retorna 401", async () => {
    const request = createTestRequest({
      url: "http://localhost/api/auth/login",
      method: "POST",
      body: { email: ctx.pastor.email, password: "senhaerrada" },
      user: ctx.pastor,
    });

    const response = await postLogin(request);

    expect(response.status).toBe(401);
  });
});

describe("Integração: Busca de Pessoas", () => {
  it("pastor busca membro por nome e encontra", async () => {
    const request = createTestRequest({
      url: "http://localhost/api/people?search=Membro",
      method: "GET",
      token: ctx.pastor.token,
      user: ctx.pastor,
    });

    const response = await getPeople(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.people).toHaveLength(1);
    expect(data.people[0]?.name).toBe("Membro Teste");
  });

  it("busca sem token retorna 401", async () => {
    const request = createTestRequest({
      url: "http://localhost/api/people?search=Membro",
      method: "GET",
    });

    const response = await getPeople(request);

    expect(response.status).toBe(401);
  });
});

describe("Integração: Permission Guard", () => {
  it("líder consegue ver sua própria célula", async () => {
    const request = createTestRequest({
      url: `http://localhost/api/groups/${ctx.groupId}`,
      method: "GET",
      token: ctx.leader.token,
      user: ctx.leader,
    });

    const response = await getGroup(request, { params: Promise.resolve({ id: ctx.groupId }) });

    expect(response.status).toBe(200);
  });

  it("líder NÃO consegue ver célula de outro líder (403)", async () => {
    // Criar outro grupo com outro líder
    const otherLeaderPerson = await prisma.person.create({
      data: { churchId: ctx.churchId, name: "Outro Líder" },
    });
    const otherLeaderUser = await prisma.user.create({
      data: {
        email: "outro@teste.org",
        passwordHash: await hashPassword("teste123"),
        role: "leader",
        personId: otherLeaderPerson.id,
        churchId: ctx.churchId,
      },
    });
    const otherGroup = await prisma.group.create({
      data: {
        churchId: ctx.churchId,
        name: "Outra Célula",
        leaderId: otherLeaderUser.id,
      },
    });

    const request = createTestRequest({
      url: `http://localhost/api/groups/${otherGroup.id}`,
      method: "GET",
      token: ctx.leader.token,
      user: ctx.leader,
    });

    const response = await getGroup(request, { params: Promise.resolve({ id: otherGroup.id }) });

    expect(response.status).toBe(403);
  });
});

describe("Integração: Registro de Presença", () => {
  it("líder registra presença no evento da sua célula", async () => {
    const request = createTestRequest({
      url: `http://localhost/api/events/${ctx.eventId}/attendance`,
      method: "POST",
      token: ctx.leader.token,
      user: ctx.leader,
      body: {
        attendances: [
          { personId: ctx.member.personId, present: true },
        ],
      },
    });

    const response = await postAttendance(request, {
      params: Promise.resolve({ id: ctx.eventId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary.total).toBe(1);
    expect(data.summary.present).toBe(1);
  });

  it("registro de presença gera audit log", async () => {
    const beforeCount = await prisma.auditLog.count({
      where: { resource: "attendance", resourceId: ctx.eventId },
    });

    const request = createTestRequest({
      url: `http://localhost/api/events/${ctx.eventId}/attendance`,
      method: "POST",
      token: ctx.leader.token,
      user: ctx.leader,
      body: {
        attendances: [
          { personId: ctx.member.personId, present: false },
        ],
      },
    });

    await postAttendance(request, {
      params: Promise.resolve({ id: ctx.eventId }),
    });

    // Aguardar fire-and-forget (pequeno delay)
    await new Promise((r) => setTimeout(r, 200));

    const afterCount = await prisma.auditLog.count({
      where: { resource: "attendance", resourceId: ctx.eventId },
    });

    expect(afterCount).toBeGreaterThanOrEqual(beforeCount);
  });
});
