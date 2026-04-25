import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { signAccessToken } from "@/lib/auth";

export interface TestUser {
  userId: string;
  personId: string;
  churchId: string;
  role: string;
  email: string;
  token: string;
}

/**
 * Limpa e recria dados mínimos para testes de integração.
 * Usa o banco configurado em DATABASE_URL.
 */
export async function setupIntegrationTest(): Promise<{
  churchId: string;
  pastor: TestUser;
  leader: TestUser;
  member: TestUser;
  groupId: string;
  eventId: string;
}> {
  // Limpar dados de teste anteriores
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.consentLog.deleteMany(),
    prisma.personTag.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.task.deleteMany(),
    prisma.need.deleteMany(),
    prisma.interaction.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.riskScore.deleteMany(),
    prisma.membership.deleteMany(),
    prisma.event.deleteMany(),
    prisma.eventRecurrence.deleteMany(),
    prisma.eventType.deleteMany(),
    prisma.group.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.user.deleteMany(),
    prisma.person.deleteMany(),
    prisma.church.deleteMany(),
  ]);

  // Criar igreja
  const church = await prisma.church.create({
    data: { name: "Igreja Teste" },
  });

  // Criar tipo de evento
  const eventType = await prisma.eventType.create({
    data: {
      churchId: church.id,
      name: "Célula",
      kind: "community_bond",
    },
  });

  // Criar pessoas
  const [pastorPerson, leaderPerson, memberPerson] = await Promise.all([
    prisma.person.create({
      data: {
        churchId: church.id,
        name: "Pastor Teste",
        phone: "+55 11 99999-0001",
      },
    }),
    prisma.person.create({
      data: {
        churchId: church.id,
        name: "Líder Teste",
        phone: "+55 11 99999-0002",
      },
    }),
    prisma.person.create({
      data: {
        churchId: church.id,
        name: "Membro Teste",
        phone: "+55 11 99999-0003",
      },
    }),
  ]);

  // Criar usuários primeiro (precisamos dos IDs para o grupo)
  const passwordHash = await hashPassword("teste123");

  const [pastorUser, leaderUser] = await Promise.all([
    prisma.user.create({
      data: {
        email: "pastor@teste.org",
        passwordHash,
        role: "pastor",
        personId: pastorPerson.id,
        churchId: church.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "lider@teste.org",
        passwordHash,
        role: "leader",
        personId: leaderPerson.id,
        churchId: church.id,
      },
    }),
  ]);

  // Criar grupo com User.ids (não Person.ids)
  const group = await prisma.group.create({
    data: {
      churchId: church.id,
      name: "Célula Esperança",
      leaderUserId: leaderUser.id,
      supervisorUserId: pastorUser.id,
    },
  });

  // Criar membership do membro
  await prisma.membership.create({
    data: {
      personId: memberPerson.id,
      groupId: group.id,
      role: "member",
    },
  });

  // Criar evento
  const event = await prisma.event.create({
    data: {
      groupId: group.id,
      eventTypeId: eventType.id,
      scheduledAt: new Date(),
      occurredAt: new Date(),
    },
  });

  // Gerar tokens
  const pastorToken = await signAccessToken({
    sub: pastorUser.id,
    email: pastorUser.email,
    role: pastorUser.role,
    personId: pastorPerson.id,
    churchId: church.id,
    name: pastorPerson.name,
  });

  const leaderToken = await signAccessToken({
    sub: leaderUser.id,
    email: leaderUser.email,
    role: leaderUser.role,
    personId: leaderPerson.id,
    churchId: church.id,
    name: leaderPerson.name,
  });

  return {
    churchId: church.id,
    pastor: {
      userId: pastorUser.id,
      personId: pastorPerson.id,
      churchId: church.id,
      role: "pastor",
      email: pastorUser.email,
      token: pastorToken,
    },
    leader: {
      userId: leaderUser.id,
      personId: leaderPerson.id,
      churchId: church.id,
      role: "leader",
      email: leaderUser.email,
      token: leaderToken,
    },
    member: {
      userId: "",
      personId: memberPerson.id,
      churchId: church.id,
      role: "member",
      email: "",
      token: "",
    },
    groupId: group.id,
    eventId: event.id,
  };
}

/**
 * Cria um Request mockado para testar handlers Next.js.
 */
export function createTestRequest({
  url = "http://localhost/api/test",
  method = "GET",
  body,
  token,
  user,
}: {
  url?: string;
  method?: string;
  body?: Record<string, unknown>;
  token?: string;
  user?: { userId: string; role: string; personId: string; churchId: string };
}): Request {
  const headers = new Headers();
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }
  if (user) {
    headers.set("x-user-id", user.userId);
    headers.set("x-user-role", user.role);
    headers.set("x-person-id", user.personId);
    headers.set("x-church-id", user.churchId);
  }
  if (body) {
    headers.set("content-type", "application/json");
  }

  return new Request(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });
}
