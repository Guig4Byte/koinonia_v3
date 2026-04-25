import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Limpar dados existentes (respeitando FKs)
  await prisma.$transaction([
    prisma.refreshToken.deleteMany(),
    prisma.task.deleteMany(),
    prisma.need.deleteMany(),
    prisma.interaction.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.riskScore.deleteMany(),
    prisma.personTag.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.consentLog.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.eventRecurrence.deleteMany(),
    prisma.membership.deleteMany(),
    prisma.event.deleteMany(),
    prisma.eventType.deleteMany(),
    prisma.group.deleteMany(),
    prisma.user.deleteMany(),
    prisma.person.deleteMany(),
    prisma.church.deleteMany(),
  ])

  console.log('🧹 Dados anteriores removidos')

  // ─── Igreja ───
  const church = await prisma.church.create({
    data: { name: 'Comunidade Esperança' },
  })
  console.log('⛪ Igreja criada:', church.name)

  // ─── Tipos de Evento ───
  const [cellType, emcType] = await Promise.all([
    prisma.eventType.create({
      data: {
        churchId: church.id,
        name: 'Célula',
        kind: 'community_bond',
        riskWeight: 3,
      },
    }),
    prisma.eventType.create({
      data: {
        churchId: church.id,
        name: 'EMC',
        kind: 'development',
        riskWeight: 2,
      },
    }),
  ])
  console.log('📅 Tipos de evento criados')

  // ─── Pessoas (Pastor, Supervisora, Líder) ───
  const [robertoPerson, anaPerson, brunoPerson] = await Promise.all([
    prisma.person.create({
      data: {
        churchId: church.id,
        name: 'Roberto Silva',
        phone: '+55 11 99999-0001',
      },
    }),
    prisma.person.create({
      data: {
        churchId: church.id,
        name: 'Ana Paula',
        phone: '+55 11 99999-0002',
      },
    }),
    prisma.person.create({
      data: {
        churchId: church.id,
        name: 'Bruno Costa',
        phone: '+55 11 99999-0003',
      },
    }),
  ])

  // ─── Usuários ───
  const commonPassword = await hashPassword('koinonia123')

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'roberto@comunidadeesperanca.org',
        passwordHash: commonPassword,
        role: 'pastor',
        personId: robertoPerson.id,
        churchId: church.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'ana@comunidadeesperanca.org',
        passwordHash: commonPassword,
        role: 'supervisor',
        personId: anaPerson.id,
        churchId: church.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'bruno@comunidadeesperanca.org',
        passwordHash: commonPassword,
        role: 'leader',
        personId: brunoPerson.id,
        churchId: church.id,
      },
    }),
  ])

  const robertoUser = users[0]
  const anaUser = users[1]
  const brunoUser = users[2]
  console.log('👤 Usuários criados (senha: koinonia123)')

  // ─── Células ───
  const [esperanca, agape, shalom] = await Promise.all([
    prisma.group.create({
      data: {
        churchId: church.id,
        name: 'Esperança',
        leaderUserId: brunoUser.id,
        supervisorUserId: anaUser.id,
      },
    }),
    prisma.group.create({
      data: {
        churchId: church.id,
        name: 'Ágape',
        leaderUserId: anaUser.id,
        supervisorUserId: anaUser.id,
      },
    }),
    prisma.group.create({
      data: {
        churchId: church.id,
        name: 'Shalom',
        leaderUserId: robertoUser.id,
        supervisorUserId: anaUser.id,
      },
    }),
  ])
  console.log('🏠 Células criadas')

  // ─── Membros ───
  const membersData = [
    { name: 'Cláudio Mendes', phone: '+55 11 98888-0001', groupId: esperanca.id },
    { name: 'Maria Oliveira', phone: '+55 11 98888-0002', groupId: esperanca.id },
    { name: 'Pedro Souza', phone: '+55 11 98888-0003', groupId: esperanca.id },
    { name: 'Carla Ferreira', phone: '+55 11 98888-0004', groupId: esperanca.id },
    { name: 'Lucas Santos', phone: '+55 11 98888-0005', groupId: esperanca.id },
    { name: 'Fernanda Lima', phone: '+55 11 98888-0006', groupId: agape.id },
    { name: 'Ricardo Almeida', phone: '+55 11 98888-0007', groupId: agape.id },
    { name: 'Juliana Costa', phone: '+55 11 98888-0008', groupId: shalom.id },
    { name: 'Marcos Pereira', phone: '+55 11 98888-0009', groupId: shalom.id },
    { name: 'Amanda Rocha', phone: '+55 11 98888-0010', groupId: shalom.id },
  ]

  const members = await Promise.all(
    membersData.map((m) =>
      prisma.person.create({
        data: {
          churchId: church.id,
          name: m.name,
          phone: m.phone,
          memberships: {
            create: {
              groupId: m.groupId,
              role: 'member',
            },
          },
        },
      })
    )
  )
  console.log('👥 Membros criados')

  // ─── Memberships dos líderes/supervisores nas células ───
  await prisma.membership.createMany({
    data: [
      { personId: brunoPerson.id, groupId: esperanca.id, role: 'member' },
      { personId: anaPerson.id, groupId: agape.id, role: 'member' },
      { personId: anaPerson.id, groupId: shalom.id, role: 'member' },
      { personId: robertoPerson.id, groupId: shalom.id, role: 'member' },
    ],
  })
  console.log('🔗 Memberships de líderes/supervisores criadas')

  // ─── Eventos ───
  const now = new Date()
  const events = await Promise.all([
    prisma.event.create({
      data: {
        groupId: esperanca.id,
        eventTypeId: cellType.id,
        scheduledAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        occurredAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.event.create({
      data: {
        groupId: esperanca.id,
        eventTypeId: cellType.id,
        scheduledAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        occurredAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.event.create({
      data: {
        groupId: esperanca.id,
        eventTypeId: emcType.id,
        scheduledAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        occurredAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.event.create({
      data: {
        groupId: esperanca.id,
        eventTypeId: cellType.id,
        scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      },
    }),
  ])
  console.log('📆 Eventos criados')

  // ─── Presenças ───
  const esperancaMembers = members.filter((_, i) => i < 5)
  const attendanceData: { eventId: string; personId: string; present: boolean }[] = []

  // Evento 1 (semana passada): Cláudio faltou
  esperancaMembers.forEach((m, i) => {
    attendanceData.push({
      eventId: events[0].id,
      personId: m.id,
      present: i !== 0,
    })
  })

  // Evento 2 (2 semanas atrás): Cláudio e Maria faltaram
  esperancaMembers.forEach((m, i) => {
    attendanceData.push({
      eventId: events[1].id,
      personId: m.id,
      present: i > 1,
    })
  })

  // Evento 3 (EMC): todos presentes
  esperancaMembers.forEach((m) => {
    attendanceData.push({
      eventId: events[2].id,
      personId: m.id,
      present: true,
    })
  })

  // Evento 4 (futuro): sem presença registrada

  await prisma.attendance.createMany({ data: attendanceData })
  console.log('✅ Presenças registradas')

  // ─── Risk Scores, Interações, Needs, Tasks ───
  const claudio = esperancaMembers[0]!
  const maria = esperancaMembers[1]!
  const pedro = esperancaMembers[2]!

  await prisma.riskScore.createMany({
    data: [
      {
        personId: claudio.id,
        score: 25,
        level: 'red',
        reasons: ['2_faltas_consecutivas', 'sem_contato_14d'],
      },
      {
        personId: maria.id,
        score: 65,
        level: 'yellow',
        reasons: ['1_falta', 'visitante_novo'],
      },
    ],
  })
  console.log('⚠️ Risk scores criados')

  await prisma.interaction.createMany({
    data: [
      {
        personId: claudio.id,
        authorId: brunoPerson.id,
        kind: 'call',
        content: 'Ligou, não atendeu. Deixei mensagem no WhatsApp.',
      },
      {
        personId: pedro.id,
        authorId: brunoPerson.id,
        kind: 'visit',
        content: 'Visitou em casa. Está bem, mas com problemas no trabalho.',
      },
    ],
  })
  console.log('💬 Interações criadas')

  await prisma.need.createMany({
    data: [
      {
        personId: claudio.id,
        kind: 'prayer',
        priority: 'high',
        content: 'Pedido de oração pela saúde da mãe',
      },
      {
        personId: pedro.id,
        kind: 'social',
        priority: 'medium',
        content: 'Precisa de ajuda com emprego',
      },
    ],
  })
  console.log('🙏 Necessidades criadas')

  await prisma.task.createMany({
    data: [
      {
        assigneeId: brunoUser.id,
        targetType: 'person',
        targetId: claudio.id,
        description: 'Ligar para Cláudio novamente. Terceira tentativa.',
        dueAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        assigneeId: brunoUser.id,
        targetType: 'person',
        targetId: maria.id,
        description: 'Acolher Maria na próxima célula. Segunda semana.',
        dueAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        assigneeId: anaUser.id,
        targetType: 'leader',
        targetId: brunoUser.id,
        description: 'Cobrar Bruno sobre follow-ups atrasados de Cláudio.',
        dueAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      },
    ],
  })
  console.log('✓ Tasks criadas')

  // ─── Tags ───
  const [tagNovo, tagRisco, tagVisitante] = await Promise.all([
    prisma.tag.create({
      data: { churchId: church.id, name: 'Novo Convertido', color: '#185FA5' },
    }),
    prisma.tag.create({
      data: { churchId: church.id, name: 'Em Risco', color: '#993C1D' },
    }),
    prisma.tag.create({
      data: { churchId: church.id, name: 'Visitante', color: '#854F0B' },
    }),
  ])
  console.log('🏷️ Tags criadas')

  // ─── PersonTags ───
  await prisma.personTag.createMany({
    data: [
      { personId: claudio.id, tagId: tagRisco.id },
      { personId: maria.id, tagId: tagVisitante.id },
      { personId: maria.id, tagId: tagNovo.id },
    ],
  })
  console.log('🏷️ PersonTags criadas')

  // ─── EventRecurrences ───
  await prisma.eventRecurrence.createMany({
    data: [
      {
        churchId: church.id,
        groupId: esperanca.id,
        eventTypeId: cellType.id,
        recurrence: 'weekly',
        dayOfWeek: 4, // quinta
        time: '20:00',
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        location: 'Casa do Bruno',
      },
      {
        churchId: church.id,
        groupId: esperanca.id,
        eventTypeId: emcType.id,
        recurrence: 'monthly',
        dayOfWeek: 0, // domingo
        time: '18:00',
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        location: 'Templo Central',
      },
    ],
  })
  console.log('🔄 EventRecurrences criadas')

  // ─── ConsentLogs ───
  await prisma.consentLog.createMany({
    data: [
      {
        personId: robertoPerson.id,
        kind: 'data_usage',
        granted: true,
        ip: '127.0.0.1',
      },
      {
        personId: anaPerson.id,
        kind: 'data_usage',
        granted: true,
      },
      {
        personId: brunoPerson.id,
        kind: 'data_usage',
        granted: true,
      },
    ],
  })
  console.log('📋 ConsentLogs criados')

  // ─── AuditLogs ───
  await prisma.auditLog.createMany({
    data: [
      {
        userId: users[0].id,
        action: 'create',
        resource: 'person',
        resourceId: claudio.id,
        details: 'Criado via seed',
        ip: '127.0.0.1',
      },
      {
        userId: users[2].id,
        action: 'read',
        resource: 'group',
        resourceId: esperanca.id,
        details: 'Consulta célula Esperança',
      },
    ],
  })
  console.log('📋 AuditLogs criados')

  console.log('\n🎉 Seed concluído com sucesso!')
  console.log('\nUsuários de teste:')
  console.log('  roberto@comunidadeesperanca.org (pastor)')
  console.log('  ana@comunidadeesperanca.org (supervisora)')
  console.log('  bruno@comunidadeesperanca.org (líder)')
  console.log('  Senha comum: koinonia123')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
