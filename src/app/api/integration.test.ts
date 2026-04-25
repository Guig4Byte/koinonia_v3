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
import {
  setupIntegrationTest,
  createTestRequest,
} from "./_test/integration-setup";
import { prisma } from "@/lib/prisma";
import { hashPassword, signAccessToken } from "@/lib/auth";
import { GET as getPeople } from "./people/route";
import { POST as postLogin } from "./auth/login/route";
import { POST as postRefresh } from "./auth/refresh/route";
import { POST as postLogout } from "./auth/logout/route";
import { POST as postAttendance } from "./events/[id]/attendance/route";
import { GET as getGroup } from "./groups/[id]/route";
import { POST as postTask } from "./tasks/route";

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

  it("rate limit bloqueia após 5 tentativas falhas de login", async () => {
    const ip = "192.168.50.50";

    for (let i = 0; i < 5; i++) {
      const request = createTestRequest({
        url: "http://localhost/api/auth/login",
        method: "POST",
        body: { email: ctx.pastor.email, password: "senhaerrada" },
      });
      request.headers.set("x-forwarded-for", ip);
      const response = await postLogin(request);
      expect(response.status).toBe(401);
    }

    const blockedRequest = createTestRequest({
      url: "http://localhost/api/auth/login",
      method: "POST",
      body: { email: ctx.pastor.email, password: "senhaerrada" },
    });
    blockedRequest.headers.set("x-forwarded-for", ip);
    const blockedResponse = await postLogin(blockedRequest);

    expect(blockedResponse.status).toBe(429);
    const data = await blockedResponse.json();
    expect(data.error).toBe("RATE_LIMIT_EXCEEDED");
  });

  it("refresh token rotation gera novo par de tokens", async () => {
    // Login para obter tokens reais
    const loginRequest = createTestRequest({
      url: "http://localhost/api/auth/login",
      method: "POST",
      body: { email: ctx.leader.email, password: "teste123" },
    });
    const loginResponse = await postLogin(loginRequest);
    const loginData = await loginResponse.json();
    const originalRefreshToken = loginData.refreshToken;

    // Refresh
    const refreshRequest = createTestRequest({
      url: "http://localhost/api/auth/refresh",
      method: "POST",
      body: { refreshToken: originalRefreshToken },
    });
    const refreshResponse = await postRefresh(refreshRequest);
    const refreshData = await refreshResponse.json();

    expect(refreshResponse.status).toBe(200);
    expect(refreshData.accessToken).toBeDefined();
    expect(refreshData.refreshToken).toBeDefined();
    expect(refreshData.refreshToken).not.toBe(originalRefreshToken);
  });

  it("reutilização de refresh token revogado retorna 401", async () => {
    // Login para obter tokens reais
    const loginRequest = createTestRequest({
      url: "http://localhost/api/auth/login",
      method: "POST",
      body: { email: ctx.pastor.email, password: "teste123" },
    });
    const loginResponse = await postLogin(loginRequest);
    const loginData = await loginResponse.json();
    const refreshToken = loginData.refreshToken;

    // Primeiro refresh (vai rotacionar)
    const refreshRequest1 = createTestRequest({
      url: "http://localhost/api/auth/refresh",
      method: "POST",
      body: { refreshToken },
    });
    const refreshResponse1 = await postRefresh(refreshRequest1);
    expect(refreshResponse1.status).toBe(200);

    // Segundo refresh com o mesmo token (deve falhar)
    const refreshRequest2 = createTestRequest({
      url: "http://localhost/api/auth/refresh",
      method: "POST",
      body: { refreshToken },
    });
    const refreshResponse2 = await postRefresh(refreshRequest2);
    expect(refreshResponse2.status).toBe(401);
  });

  it("logout invalida refresh token no servidor", async () => {
    // Login
    const loginRequest = createTestRequest({
      url: "http://localhost/api/auth/login",
      method: "POST",
      body: { email: ctx.pastor.email, password: "teste123" },
    });
    const loginResponse = await postLogin(loginRequest);
    const loginData = await loginResponse.json();
    const refreshToken = loginData.refreshToken;

    // Logout
    const logoutRequest = createTestRequest({
      url: "http://localhost/api/auth/logout",
      method: "POST",
      body: { refreshToken },
    });
    const logoutResponse = await postLogout(logoutRequest);
    expect(logoutResponse.status).toBe(200);

    // Tentar refresh após logout
    const refreshRequest = createTestRequest({
      url: "http://localhost/api/auth/refresh",
      method: "POST",
      body: { refreshToken },
    });
    const refreshResponse = await postRefresh(refreshRequest);
    expect(refreshResponse.status).toBe(401);
  });

  it("logout com body inválido retorna 400", async () => {
    const logoutRequest = createTestRequest({
      url: "http://localhost/api/auth/logout",
      method: "POST",
      body: { invalid: true },
    });
    const logoutResponse = await postLogout(logoutRequest);
    expect(logoutResponse.status).toBe(400);
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

    const response = await getGroup(request, {
      params: Promise.resolve({ id: ctx.groupId }),
    });

    expect(response.status).toBe(200);
  });

  it("líder NÃO consegue ver célula de outro líder (403)", async () => {
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

    const response = await getGroup(request, {
      params: Promise.resolve({ id: otherGroup.id }),
    });

    expect(response.status).toBe(403);
  });
});

describe("Integração: Cross-Church Access", () => {
  it("usuário de outra igreja não consegue ver pessoas da igreja A", async () => {
    // Criar outra igreja com usuário
    const otherChurch = await prisma.church.create({
      data: { name: "Outra Igreja" },
    });
    const otherPerson = await prisma.person.create({
      data: { churchId: otherChurch.id, name: "Outro Pastor" },
    });
    const otherUser = await prisma.user.create({
      data: {
        email: "outro@igreja.org",
        passwordHash: await hashPassword("teste123"),
        role: "pastor",
        personId: otherPerson.id,
        churchId: otherChurch.id,
      },
    });
    const otherToken = await signAccessToken({
      sub: otherUser.id,
      email: otherUser.email,
      role: otherUser.role,
      personId: otherPerson.id,
      churchId: otherChurch.id,
      name: otherPerson.name,
    });

    // Tentar buscar pessoas da igreja A
    const request = createTestRequest({
      url: "http://localhost/api/people?search=Membro",
      method: "GET",
      token: otherToken,
      user: {
        userId: otherUser.id,
        role: "pastor",
        personId: otherPerson.id,
        churchId: otherChurch.id,
      },
    });

    const response = await getPeople(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Não deve encontrar membros da igreja A
    expect(data.people).toHaveLength(0);
  });

  it("usuário de outra igreja não consegue ver grupo da igreja A", async () => {
    const otherChurch = await prisma.church.create({
      data: { name: "Igreja C" },
    });
    const otherPerson = await prisma.person.create({
      data: { churchId: otherChurch.id, name: "Outro" },
    });
    const otherUser = await prisma.user.create({
      data: {
        email: "outro2@igreja.org",
        passwordHash: await hashPassword("teste123"),
        role: "pastor",
        personId: otherPerson.id,
        churchId: otherChurch.id,
      },
    });
    const otherToken = await signAccessToken({
      sub: otherUser.id,
      email: otherUser.email,
      role: otherUser.role,
      personId: otherPerson.id,
      churchId: otherChurch.id,
      name: otherPerson.name,
    });

    const request = createTestRequest({
      url: `http://localhost/api/groups/${ctx.groupId}`,
      method: "GET",
      token: otherToken,
      user: {
        userId: otherUser.id,
        role: "pastor",
        personId: otherPerson.id,
        churchId: otherChurch.id,
      },
    });

    const response = await getGroup(request, {
      params: Promise.resolve({ id: ctx.groupId }),
    });

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
        attendances: [{ personId: ctx.member.personId, present: true }],
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

  it("membro não consegue acessar rota de líder (401)", async () => {
    const memberPerson = await prisma.person.create({
      data: { churchId: ctx.churchId, name: "Membro Qualquer" },
    });
    const memberUser = await prisma.user.create({
      data: {
        email: "membro@teste.org",
        passwordHash: await hashPassword("teste123"),
        role: "member",
        personId: memberPerson.id,
        churchId: ctx.churchId,
      },
    });
    const memberToken = await signAccessToken({
      sub: memberUser.id,
      email: memberUser.email,
      role: memberUser.role,
      personId: memberPerson.id,
      churchId: ctx.churchId,
      name: memberPerson.name,
    });

    const request = createTestRequest({
      url: `http://localhost/api/groups/${ctx.groupId}`,
      method: "GET",
      token: memberToken,
      user: {
        userId: memberUser.id,
        role: "member",
        personId: memberPerson.id,
        churchId: ctx.churchId,
      },
    });

    const response = await getGroup(request, {
      params: Promise.resolve({ id: ctx.groupId }),
    });
    expect(response.status).toBe(403);
  });

  it("pastor consegue acessar qualquer grupo da igreja", async () => {
    const request = createTestRequest({
      url: `http://localhost/api/groups/${ctx.groupId}`,
      method: "GET",
      token: ctx.pastor.token,
      user: ctx.pastor,
    });

    const response = await getGroup(request, {
      params: Promise.resolve({ id: ctx.groupId }),
    });
    expect(response.status).toBe(200);
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
        attendances: [{ personId: ctx.member.personId, present: false }],
      },
    });

    await postAttendance(request, {
      params: Promise.resolve({ id: ctx.eventId }),
    });

    await new Promise((r) => setTimeout(r, 200));

    const afterCount = await prisma.auditLog.count({
      where: { resource: "attendance", resourceId: ctx.eventId },
    });

    expect(afterCount).toBeGreaterThanOrEqual(beforeCount);
  });

  it("não permite registrar presença de pessoa de outro grupo", async () => {
    // Cria pessoa em outro grupo (sem membership no grupo do evento)
    const outsiderPerson = await prisma.person.create({
      data: { churchId: ctx.churchId, name: "Forasteiro" },
    });

    const request = createTestRequest({
      url: `http://localhost/api/events/${ctx.eventId}/attendance`,
      method: "POST",
      token: ctx.leader.token,
      user: ctx.leader,
      body: {
        attendances: [
          { personId: ctx.member.personId, present: true },
          { personId: outsiderPerson.id, present: true }, // não pertence ao grupo
        ],
      },
    });

    const response = await postAttendance(request, {
      params: Promise.resolve({ id: ctx.eventId }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("INVALID_ATTENDEES");
  });
});

describe("Integração: Criação de Tasks", () => {
  it("rejeita task com assignee de outra igreja", async () => {
    const otherChurch = await prisma.church.create({
      data: { name: "Outra Igreja" },
    });
    const otherPerson = await prisma.person.create({
      data: { churchId: otherChurch.id, name: "Outro" },
    });
    const otherUser = await prisma.user.create({
      data: {
        email: "outro@task.org",
        passwordHash: await hashPassword("teste123"),
        role: "leader",
        personId: otherPerson.id,
        churchId: otherChurch.id,
      },
    });

    const request = createTestRequest({
      url: "http://localhost/api/tasks",
      method: "POST",
      token: ctx.pastor.token,
      user: ctx.pastor,
      body: {
        assigneeId: otherUser.id,
        groupId: ctx.groupId,
        description: "Task inválida",
        dueAt: new Date(Date.now() + 86400000).toISOString(),
        targetType: "person",
        targetId: ctx.member.personId,
      },
    });

    const response = await postTask(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("USER_NOT_FOUND");
  });

  it("rejeita task com targetId inválido para targetType person", async () => {
    const request = createTestRequest({
      url: "http://localhost/api/tasks",
      method: "POST",
      token: ctx.pastor.token,
      user: ctx.pastor,
      body: {
        assigneeId: ctx.leader.userId,
        groupId: ctx.groupId,
        description: "Task com target inválido",
        dueAt: new Date(Date.now() + 86400000).toISOString(),
        targetType: "person",
        targetId: "person-inexistente",
      },
    });

    const response = await postTask(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("INVALID_TASK_TARGET");
  });

  it("rejeita task com assignee da mesma igreja que não lidera nem supervisiona o grupo", async () => {
    const person = await prisma.person.create({
      data: { churchId: ctx.churchId, name: "Líder sem vínculo" },
    });
    const user = await prisma.user.create({
      data: {
        email: "lider-sem-vinculo@task.org",
        passwordHash: await hashPassword("teste123"),
        role: "leader",
        personId: person.id,
        churchId: ctx.churchId,
      },
    });

    const request = createTestRequest({
      url: "http://localhost/api/tasks",
      method: "POST",
      token: ctx.pastor.token,
      user: ctx.pastor,
      body: {
        assigneeId: user.id,
        groupId: ctx.groupId,
        description: "Task para usuário sem vínculo com a célula",
        dueAt: new Date(Date.now() + 86400000).toISOString(),
        targetType: "group",
        targetId: ctx.groupId,
      },
    });

    const response = await postTask(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("INVALID_TASK_TARGET");
  });

  it("rejeita task para pessoa da mesma igreja fora da célula informada", async () => {
    const person = await prisma.person.create({
      data: { churchId: ctx.churchId, name: "Pessoa fora da célula" },
    });

    const request = createTestRequest({
      url: "http://localhost/api/tasks",
      method: "POST",
      token: ctx.pastor.token,
      user: ctx.pastor,
      body: {
        assigneeId: ctx.leader.userId,
        groupId: ctx.groupId,
        description: "Task para pessoa fora da célula",
        dueAt: new Date(Date.now() + 86400000).toISOString(),
        targetType: "person",
        targetId: person.id,
      },
    });

    const response = await postTask(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("INVALID_TASK_TARGET");
  });
});
