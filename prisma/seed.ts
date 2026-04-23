import { hash } from "bcryptjs";
import {
  EventKind,
  InteractionKind,
  MembershipRole,
  NeedKind,
  PrismaClient,
  Priority,
  RiskLevel,
  Role,
  TaskTarget,
} from "@prisma/client";

const prisma = new PrismaClient();

const daysAgo = (days: number, hour = 19) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
};

async function main() {
  const sharedPassword = await hash("koinonia123", 10);
  const createMember = (name: string, phone: string, birthDate: string) =>
    prisma.person.create({
      data: {
        churchId: church.id,
        name,
        phone,
        birthDate: new Date(`${birthDate}T00:00:00.000Z`),
      },
    });

  await prisma.refreshToken.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.interaction.deleteMany();
  await prisma.task.deleteMany();
  await prisma.need.deleteMany();
  await prisma.riskScore.deleteMany();
  await prisma.event.deleteMany();
  await prisma.eventType.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.group.deleteMany();
  await prisma.person.deleteMany();
  await prisma.church.deleteMany();

  const church = await prisma.church.create({
    data: {
      name: "Comunidade Esperança",
    },
  });

  const roberto = await prisma.person.create({
    data: {
      churchId: church.id,
      name: "Roberto Almeida",
      phone: "+55 11 99999-1001",
      birthDate: new Date("1973-08-18T00:00:00.000Z"),
    },
  });

  const ana = await prisma.person.create({
    data: {
      churchId: church.id,
      name: "Ana Carvalho",
      phone: "+55 11 99999-1002",
      birthDate: new Date("1985-04-02T00:00:00.000Z"),
    },
  });

  const bruno = await prisma.person.create({
    data: {
      churchId: church.id,
      name: "Bruno Martins",
      phone: "+55 11 99999-1003",
      birthDate: new Date("1991-11-26T00:00:00.000Z"),
    },
  });

  const carla = await createMember("Carla Mendes", "+55 11 99999-2001", "1994-02-14");
  const daniel = await createMember("Daniel Rocha", "+55 11 99999-2002", "1989-06-30");
  const ester = await createMember("Ester Alves", "+55 11 99999-2003", "1997-09-08");
  const felipe = await createMember("Felipe Costa", "+55 11 99999-2004", "1988-05-12");
  const gabriela = await createMember("Gabriela Santos", "+55 11 99999-2005", "1995-01-20");
  const helena = await createMember("Helena Ferreira", "+55 11 99999-2006", "1979-12-04");
  const igor = await createMember("Igor Nascimento", "+55 11 99999-2007", "1992-03-10");
  const juliana = await createMember("Juliana Oliveira", "+55 11 99999-2008", "1986-07-17");
  const leandro = await createMember("Leandro Gomes", "+55 11 99999-2009", "1990-10-09");
  const mariana = await createMember("Mariana Barros", "+55 11 99999-2010", "1998-04-28");

  await prisma.user.createMany({
    data: [
      {
        email: "roberto@comunidadeesperanca.org",
        passwordHash: sharedPassword,
        role: Role.pastor,
        personId: roberto.id,
        churchId: church.id,
      },
      {
        email: "ana@comunidadeesperanca.org",
        passwordHash: sharedPassword,
        role: Role.supervisor,
        personId: ana.id,
        churchId: church.id,
      },
      {
        email: "bruno@comunidadeesperanca.org",
        passwordHash: sharedPassword,
        role: Role.leader,
        personId: bruno.id,
        churchId: church.id,
      },
    ],
  });

  const groupEsperanca = await prisma.group.create({
    data: {
      churchId: church.id,
      name: "Esperança",
      leaderId: bruno.id,
      supervisorId: ana.id,
    },
  });

  const groupAgape = await prisma.group.create({
    data: {
      churchId: church.id,
      name: "Ágape",
      leaderId: felipe.id,
      supervisorId: ana.id,
    },
  });

  const groupShalom = await prisma.group.create({
    data: {
      churchId: church.id,
      name: "Shalom",
      leaderId: juliana.id,
      supervisorId: ana.id,
    },
  });

  await prisma.membership.createMany({
    data: [
      { personId: bruno.id, groupId: groupEsperanca.id, role: MembershipRole.host },
      { personId: carla.id, groupId: groupEsperanca.id, role: MembershipRole.member },
      { personId: daniel.id, groupId: groupEsperanca.id, role: MembershipRole.member },
      { personId: ester.id, groupId: groupEsperanca.id, role: MembershipRole.member },
      { personId: felipe.id, groupId: groupAgape.id, role: MembershipRole.host },
      { personId: gabriela.id, groupId: groupAgape.id, role: MembershipRole.member },
      { personId: helena.id, groupId: groupAgape.id, role: MembershipRole.member },
      { personId: igor.id, groupId: groupShalom.id, role: MembershipRole.member },
      { personId: juliana.id, groupId: groupShalom.id, role: MembershipRole.host },
      { personId: leandro.id, groupId: groupShalom.id, role: MembershipRole.member },
      { personId: mariana.id, groupId: groupShalom.id, role: MembershipRole.member },
    ],
  });

  const eventTypeCelula = await prisma.eventType.create({
    data: {
      churchId: church.id,
      name: "Célula",
      kind: EventKind.community_bond,
      riskWeight: 1,
    },
  });

  const eventTypeEmc = await prisma.eventType.create({
    data: {
      churchId: church.id,
      name: "EMC",
      kind: EventKind.development,
      riskWeight: 2,
    },
  });

  const eventoEsperanca = await prisma.event.create({
    data: {
      groupId: groupEsperanca.id,
      eventTypeId: eventTypeCelula.id,
      scheduledAt: daysAgo(18),
      occurredAt: daysAgo(18, 20),
      notes: "Encontro com foco em oração e integração dos novos membros.",
    },
  });

  const eventoAgape = await prisma.event.create({
    data: {
      groupId: groupAgape.id,
      eventTypeId: eventTypeEmc.id,
      scheduledAt: daysAgo(11),
      occurredAt: daysAgo(11, 21),
      notes: "Treinamento EMC com dinâmica em duplas.",
    },
  });

  const eventoShalom = await prisma.event.create({
    data: {
      groupId: groupShalom.id,
      eventTypeId: eventTypeCelula.id,
      scheduledAt: daysAgo(4),
      occurredAt: daysAgo(4, 20),
      notes: "Célula com ceia e conversa pastoral.",
    },
  });

  await prisma.attendance.createMany({
    data: [
      { eventId: eventoEsperanca.id, personId: bruno.id, present: true },
      { eventId: eventoEsperanca.id, personId: carla.id, present: true },
      { eventId: eventoEsperanca.id, personId: daniel.id, present: false },
      { eventId: eventoEsperanca.id, personId: ester.id, present: true },
      { eventId: eventoAgape.id, personId: felipe.id, present: true },
      { eventId: eventoAgape.id, personId: gabriela.id, present: false },
      { eventId: eventoAgape.id, personId: helena.id, present: true },
      { eventId: eventoShalom.id, personId: igor.id, present: false },
      { eventId: eventoShalom.id, personId: juliana.id, present: true },
      { eventId: eventoShalom.id, personId: leandro.id, present: false },
      { eventId: eventoShalom.id, personId: mariana.id, present: true },
    ],
  });

  await prisma.riskScore.createMany({
    data: [
      {
        personId: daniel.id,
        score: 82,
        level: RiskLevel.red,
        reasons: ["Duas ausências recentes", "Pedido de oração urgente"],
      },
      {
        personId: gabriela.id,
        score: 58,
        level: RiskLevel.yellow,
        reasons: ["Oscilação de frequência", "Contato pastoral pendente"],
      },
      {
        personId: leandro.id,
        score: 71,
        level: RiskLevel.red,
        reasons: ["Baixa presença em eventos", "Família em transição"],
      },
    ],
  });

  const danielNeed = await prisma.need.create({
    data: {
      personId: daniel.id,
      kind: NeedKind.prayer,
      priority: Priority.high,
      content: "Oração por recolocação profissional e paz emocional.",
    },
  });

  await prisma.need.create({
    data: {
      personId: gabriela.id,
      kind: NeedKind.counseling,
      priority: Priority.medium,
      content: "Conversar sobre organização da rotina e discipulado.",
    },
  });

  const [pastorUser, supervisorUser, leaderUser] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { email: "roberto@comunidadeesperanca.org" },
    }),
    prisma.user.findUniqueOrThrow({
      where: { email: "ana@comunidadeesperanca.org" },
    }),
    prisma.user.findUniqueOrThrow({
      where: { email: "bruno@comunidadeesperanca.org" },
    }),
  ]);

  await prisma.interaction.createMany({
    data: [
      {
        personId: daniel.id,
        authorId: roberto.id,
        kind: InteractionKind.prayer,
        content: "Roberto orou com Daniel após o culto de domingo.",
      },
      {
        personId: gabriela.id,
        authorId: ana.id,
        kind: InteractionKind.whatsapp,
        content: "Ana combinou um café rápido para ouvir Gabriela na próxima semana.",
      },
      {
        personId: leandro.id,
        authorId: bruno.id,
        kind: InteractionKind.visit,
        content: "Bruno visitou a família e registrou melhora no ânimo.",
      },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        assigneeId: supervisorUser.id,
        groupId: groupEsperanca.id,
        needId: danielNeed.id,
        targetType: TaskTarget.person,
        targetId: daniel.id,
        description: "Agendar visita pastoral com Daniel até sexta-feira.",
        dueAt: daysAgo(-2),
      },
      {
        assigneeId: leaderUser.id,
        groupId: groupShalom.id,
        targetType: TaskTarget.person,
        targetId: leandro.id,
        description: "Confirmar presença de Leandro no próximo encontro da célula.",
        dueAt: daysAgo(-1),
      },
      {
        assigneeId: pastorUser.id,
        targetType: TaskTarget.group,
        targetId: groupAgape.id,
        description: "Revisar a saúde geral da célula Ágape com Ana.",
        dueAt: daysAgo(-3),
      },
    ],
  });

  console.log("Seed concluído com sucesso.");
  console.log("Credenciais iniciais: roberto@comunidadeesperanca.org / ana@comunidadeesperanca.org / bruno@comunidadeesperanca.org");
  console.log("Senha para todos os usuários seedados: koinonia123");
}

main()
  .catch((error) => {
    console.error("Falha ao executar seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
