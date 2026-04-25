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
import { GET as getSharedMemberProfile } from "./members/[id]/route";
import { POST as postTask } from "./tasks/route";
import { REFRESH_TOKEN_COOKIE } from "@/lib/auth-cookies";

let ctx: Awaited<ReturnType<typeof setupIntegrationTest>>;

beforeAll(async () => {
  ctx = await setupIntegrationTest();
}, 30000);

afterAll(async () => {
  await prisma.$disconnect();
});

function extractRefreshCookie(response: Response) {
  const setCookie = response.headers.get("set-cookie");
  const escapedCookieName = REFRESH_TOKEN_COOKIE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  expect(setCookie).toContain(REFRESH_TOKEN_COOKIE);

  const match = setCookie?.match(new RegExp(`${escapedCookieName}=[^;,]+`));

  expect(match?.[0]).toBeDefined();

  return match![0];
}

function createAuthCookieRequest(url: string, refreshCookie: string) {
  return new Request(url, {
    method: "POST",
    headers: {
      cookie: refreshCookie,
    },
  });
}

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
    expect(data.refreshToken).toBeUndefined();
    expect(response.headers.get("set-cookie")).toContain(REFRESH_TOKEN_COOKIE);
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

  it("refresh token rotation gera novo access token e novo cookie HttpOnly", async () => {
    const loginRequest = createTestRequest({
      url: "http://localhost/api/auth/login",
      method: "POST",
      body: { email: ctx.leader.email, password: "teste123" },
    });
    const loginResponse = await postLogin(loginRequest);
    const originalRefreshCookie = extractRefreshCookie(loginResponse);

    const refreshRequest = createAuthCookieRequest(
      "http://localhost/api/auth/refresh",
      originalRefreshCookie,
    );
    const refreshResponse = await postRefresh(refreshRequest);
    const refreshData = await refreshResponse.json();
    const rotatedRefreshCookie = extractRefreshCookie(refreshResponse);

    expect(refreshResponse.status).toBe(200);
    expect(refreshData.accessToken).toBeDefined();
    expect(refreshData.refreshToken).toBeUndefined();
    expect(rotatedRefreshCookie).not.toBe(originalRefreshCookie);
  });

  it("reutilização de refresh token revogado retorna 401", async () => {
    const loginRequest = createTestRequest({
      url: "http://localhost/api/auth/login",
      method: "POST",
      body: { email: ctx.pastor.email, password: "teste123" },
    });
    const loginResponse = await postLogin(loginRequest);
    const refreshCookie = extractRefreshCookie(loginResponse);

    const refreshRequest1 = createAuthCookieRequest(
      "http://localhost/api/auth/refresh",
      refreshCookie,
    );
    const refreshResponse1 = await postRefresh(refreshRequest1);
    expect(refreshResponse1.status).toBe(200);

    const refreshRequest2 = createAuthCookieRequest(
      "http://localhost/api/auth/refresh",
      refreshCookie,
    );
    const refreshResponse2 = await postRefresh(refreshRequest2);
    expect(refreshResponse2.status).toBe(401);
  });

  it("logout invalida refresh token no servidor e limpa cookie", async () => {
    const loginRequest = createTestRequest({
      url: "http://localhost/api/auth/login",
      method: "POST",
      body: { email: ctx.pastor.email, password: "teste123" },
    });
    const loginResponse = await postLogin(loginRequest);
    const refreshCookie = extractRefreshCookie(loginResponse);

    const logoutRequest = createAuthCookieRequest(
      "http://localhost/api/auth/logout",
      refreshCookie,
    );
    const logoutResponse = await postLogout(logoutRequest);
    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.headers.get("set-cookie")).toContain(`${REFRESH_TOKEN_COOKIE}=`);

    const refreshRequest = createAuthCookieRequest(
      "http://localhost/api/auth/refresh",
      refreshCookie,
    );
    const refreshResponse = await postRefresh(refreshRequest);
    expect(refreshResponse.status).toBe(401);
  });

  it("logout sem cookie retorna 200 e limpa cookie local", async () => {
    const logoutRequest = createTestRequest({
      url: "http://localhost/api/auth/logout",
      method: "POST",
    });
    const logoutResponse = await postLogout(logoutRequest);
    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.headers.get("set-cookie")).toContain(`${REFRESH_TOKEN_COOKIE}=`);
  });
});

describe("Integração: Busca de Pessoas", () => {
  it("pastor busca membro por nome, encontra e gera audit log completo", async () => {
    await prisma.auditLog.deleteMany({
      where: {
        resource: "person",
        resourceId: "search",
        userId: ctx.pastor.userId,
      },
    });

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

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        resource: "person",
        resourceId: "search",
        userId: ctx.pastor.userId,
      },
      orderBy: { createdAt: "desc" },
    });

    expect(auditLog).toMatchObject({
      userId: ctx.pastor.userId,
      churchId: ctx.churchId,
      action: "read",
      resource: "person",
      resourceId: "search",
    });
    expect(auditLog?.details).toContain("Busca por");
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
        leaderUserId: otherLeaderUser.id,
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

  it("registro de presença gera audit log durável e verificável", async () => {
    await prisma.auditLog.deleteMany({
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

    const response = await postAttendance(request, {
      params: Promise.resolve({ id: ctx.eventId }),
    });

    expect(response.status).toBe(200);

    const auditLog = await prisma.auditLog.findFirst({
      where: { resource: "attendance", resourceId: ctx.eventId },
      orderBy: { createdAt: "desc" },
    });

    expect(auditLog).toMatchObject({
      userId: ctx.leader.userId,
      churchId: ctx.churchId,
      action: "create",
      resource: "attendance",
      resourceId: ctx.eventId,
    });
    expect(auditLog?.details).toContain("Registro de presença");
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

describe("Integração: Perfil compartilhado de membro", () => {
  it("líder acessa perfil de membro da sua célula", async () => {
    const request = createTestRequest({
      url: `http://localhost/api/members/${ctx.member.personId}`,
      method: "GET",
      token: ctx.leader.token,
      user: ctx.leader,
    });

    const response = await getSharedMemberProfile(request, {
      params: Promise.resolve({ id: ctx.member.personId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.person.id).toBe(ctx.member.personId);
    expect(data.person.phone).toBe("+55 11 99999-0003");
  });

  it("líder não acessa perfil de membro de outra célula da mesma igreja", async () => {
    const otherLeaderPerson = await prisma.person.create({
      data: { churchId: ctx.churchId, name: "Líder de outra célula" },
    });
    const otherLeaderUser = await prisma.user.create({
      data: {
        email: "lider-outra-celula@teste.org",
        passwordHash: await hashPassword("teste123"),
        role: "leader",
        personId: otherLeaderPerson.id,
        churchId: ctx.churchId,
      },
    });
    const otherGroup = await prisma.group.create({
      data: {
        churchId: ctx.churchId,
        name: "Outra Célula Protegida",
        leaderUserId: otherLeaderUser.id,
      },
    });
    const otherMember = await prisma.person.create({
      data: { churchId: ctx.churchId, name: "Membro de outra célula" },
    });
    await prisma.membership.create({
      data: {
        personId: otherMember.id,
        groupId: otherGroup.id,
        role: "member",
      },
    });

    const request = createTestRequest({
      url: `http://localhost/api/members/${otherMember.id}`,
      method: "GET",
      token: ctx.leader.token,
      user: ctx.leader,
    });

    const response = await getSharedMemberProfile(request, {
      params: Promise.resolve({ id: otherMember.id }),
    });

    expect(response.status).toBe(403);
  });

  it("membro acessa apenas o próprio perfil sem risco e interações pastorais", async () => {
    await prisma.riskScore.upsert({
      where: { personId: ctx.member.personId },
      create: {
        personId: ctx.member.personId,
        score: 80,
        level: "red",
        reasons: ["Teste sensível"],
      },
      update: {
        score: 80,
        level: "red",
        reasons: ["Teste sensível"],
      },
    });
    await prisma.interaction.create({
      data: {
        personId: ctx.member.personId,
        authorId: ctx.leader.personId,
        kind: "note",
        content: "Interação pastoral sensível",
      },
    });

    const memberUser = await prisma.user.create({
      data: {
        email: "membro-com-login@teste.org",
        passwordHash: await hashPassword("teste123"),
        role: "member",
        personId: ctx.member.personId,
        churchId: ctx.churchId,
      },
    });

    const request = createTestRequest({
      url: `http://localhost/api/members/${ctx.member.personId}`,
      method: "GET",
      user: {
        userId: memberUser.id,
        role: "member",
        personId: ctx.member.personId,
        churchId: ctx.churchId,
      },
    });

    const response = await getSharedMemberProfile(request, {
      params: Promise.resolve({ id: ctx.member.personId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.person.riskLevel).toBeNull();
    expect(data.person.riskScore).toBeNull();
    expect(data.person.interactions).toHaveLength(0);
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
