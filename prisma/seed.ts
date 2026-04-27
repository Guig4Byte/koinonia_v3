import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

type AppRole = 'pastor' | 'supervisor' | 'leader' | 'host' | 'member'
type MembershipKind = 'member' | 'host'
type EventKindValue = 'community_bond' | 'belonging' | 'development' | 'commitment'
type RiskLevelValue = 'green' | 'yellow' | 'red'
type InteractionKindValue = 'call' | 'whatsapp' | 'visit' | 'prayer' | 'note'
type NeedKindValue = 'prayer' | 'social' | 'counseling'
type PriorityValue = 'low' | 'medium' | 'high'

type PersonRecord = {
  id: string
  name: string
  phone: string | null
}

const DAY = 24 * 60 * 60 * 1000

function daysAgo(days: number) {
  return new Date(Date.now() - days * DAY)
}

function daysFromNow(days: number) {
  return new Date(Date.now() + days * DAY)
}

async function resetDatabase() {
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
}

async function main() {
  console.log('🌱 Iniciando seed de validação pastoral...')

  await resetDatabase()
  console.log('🧹 Dados anteriores removidos')

  const peopleByName = new Map<string, PersonRecord>()
  const usersByName = new Map<string, { id: string; email: string; role: AppRole }>()
  const groupsByName = new Map<string, { id: string; name: string }>()

  const church = await prisma.church.create({
    data: { name: 'Comunidade Esperança' },
  })

  const [cellType, emcType] = await Promise.all([
    prisma.eventType.create({
      data: {
        churchId: church.id,
        name: 'Célula',
        kind: 'community_bond' satisfies EventKindValue,
        riskWeight: 3,
      },
    }),
    prisma.eventType.create({
      data: {
        churchId: church.id,
        name: 'EMC',
        kind: 'development' satisfies EventKindValue,
        riskWeight: 2,
      },
    }),
  ])

  async function createPerson(name: string, phone?: string | null) {
    const person = await prisma.person.create({
      data: {
        churchId: church.id,
        name,
        phone: phone ?? null,
      },
    })

    peopleByName.set(name, { id: person.id, name: person.name, phone: person.phone })
    return person
  }

  const commonPassword = await hashPassword('koinonia123')

  async function createUser(name: string, email: string, role: AppRole, phone?: string | null) {
    const person = await createPerson(name, phone)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: commonPassword,
        role,
        personId: person.id,
        churchId: church.id,
      },
    })

    usersByName.set(name, { id: user.id, email: user.email, role })
    return { person, user }
  }

  const roberto = await createUser(
    'Roberto Silva',
    'roberto@comunidadeesperanca.org',
    'pastor',
    '+55 11 99999-0001',
  )
  const ana = await createUser(
    'Ana Paula',
    'ana@comunidadeesperanca.org',
    'supervisor',
    '+55 11 99999-0002',
  )
  const marta = await createUser(
    'Marta Rocha',
    'marta@comunidadeesperanca.org',
    'supervisor',
    '+55 11 99999-0004',
  )
  const bruno = await createUser(
    'Bruno Costa',
    'bruno@comunidadeesperanca.org',
    'leader',
    '+55 11 99999-0003',
  )
  const carlaLeader = await createUser(
    'Carla Ferreira',
    'carla@comunidadeesperanca.org',
    'leader',
    '+55 11 99999-0005',
  )
  const diego = await createUser(
    'Diego Martins',
    'diego@comunidadeesperanca.org',
    'leader',
    '+55 11 99999-0006',
  )
  const helenaHost = await createUser(
    'Helena Alves',
    'helena@comunidadeesperanca.org',
    'host',
    '+55 11 99999-0007',
  )

  console.log('👤 Usuários criados (senha comum: koinonia123)')

  async function createGroup(
    name: string,
    leaderUserId: string,
    supervisorUserId: string,
  ) {
    const group = await prisma.group.create({
      data: {
        churchId: church.id,
        name,
        leaderUserId,
        supervisorUserId,
      },
    })

    groupsByName.set(name, { id: group.id, name: group.name })
    return group
  }

  const esperanca = await createGroup('Esperança', bruno.user.id, ana.user.id)
  const agape = await createGroup('Ágape', carlaLeader.user.id, ana.user.id)
  const shalom = await createGroup('Shalom', diego.user.id, marta.user.id)
  const recomeco = await createGroup('Recomeço', bruno.user.id, ana.user.id)

  console.log('🏠 Células criadas')

  async function addMembership(personId: string, groupId: string, role: MembershipKind = 'member') {
    await prisma.membership.create({
      data: { personId, groupId, role },
    })
  }

  async function createMember(
    name: string,
    groupId: string,
    phone?: string | null,
    role: MembershipKind = 'member',
  ) {
    const person = await createPerson(name, phone)
    await addMembership(person.id, groupId, role)
    return person
  }

  await Promise.all([
    addMembership(bruno.person.id, esperanca.id),
    addMembership(bruno.person.id, recomeco.id),
    addMembership(carlaLeader.person.id, agape.id),
    addMembership(diego.person.id, shalom.id),
    addMembership(helenaHost.person.id, esperanca.id, 'host'),
  ])

  const lucas = await createMember('Lucas Santos', esperanca.id, '+55 11 98888-0001')
  await createMember('João Pereira', esperanca.id, null)
  const claudio = await createMember('Cláudio Mendes', esperanca.id, '+55 11 98888-0002')
  const maria = await createMember('Maria Oliveira', esperanca.id, '+55 11 98888-0003')
  await createMember('Beatriz Lima', agape.id, '+55 11 98888-0004')
  const pedro = await createMember('Pedro Souza', agape.id, '+55 11 98888-0005')
  const clara = await createMember('Clara Souza', agape.id, '+55 11 98888-0006')
  const rafael = await createMember('Rafael Costa', agape.id, '+55 11 98888-0007')
  const fernanda = await createMember('Fernanda Lima', shalom.id, '+55 11 98888-0008')
  await createMember('Ricardo Almeida', shalom.id, '+55 11 98888-0009')
  await createMember('Juliana Costa', shalom.id, '+55 11 98888-0010')
  const anaMartins = await createMember('Ana Martins', recomeco.id, '+55 11 98888-0011')
  await createMember('Marco Antônio', recomeco.id, '+55 11 98888-0012')

  // Usuário membro para validar fluxo /membro sem privilégio pastoral.
  const lucasUser = await prisma.user.create({
    data: {
      email: 'lucas@comunidadeesperanca.org',
      passwordHash: commonPassword,
      role: 'member',
      personId: lucas.id,
      churchId: church.id,
    },
  })
  usersByName.set('Lucas Santos', { id: lucasUser.id, email: lucasUser.email, role: 'member' })

  console.log('👥 Pessoas e vínculos criados')

  const [tagNovo, tagRisco, tagVisitante, tagEscalado] = await Promise.all([
    prisma.tag.create({ data: { churchId: church.id, name: 'Novo convertido', color: '#185FA5' } }),
    prisma.tag.create({ data: { churchId: church.id, name: 'Em risco', color: '#993C1D' } }),
    prisma.tag.create({ data: { churchId: church.id, name: 'Visitante', color: '#854F0B' } }),
    prisma.tag.create({ data: { churchId: church.id, name: 'Escalado ao pastor', color: '#5F4B32' } }),
  ])

  await prisma.personTag.createMany({
    data: [
      { personId: claudio.id, tagId: tagRisco.id },
      { personId: maria.id, tagId: tagVisitante.id },
      { personId: maria.id, tagId: tagNovo.id },
      { personId: clara.id, tagId: tagVisitante.id },
      { personId: anaMartins.id, tagId: tagEscalado.id },
      { personId: rafael.id, tagId: tagRisco.id },
    ],
  })

  async function createPastEvent(
    groupId: string,
    days: number,
    attendanceByName: Record<string, boolean>,
    eventTypeId = cellType.id,
  ) {
    const event = await prisma.event.create({
      data: {
        groupId,
        eventTypeId,
        scheduledAt: daysAgo(days),
        occurredAt: daysAgo(days),
      },
    })

    const attendanceData = Object.entries(attendanceByName).map(([name, present]) => {
      const person = peopleByName.get(name)
      if (!person) throw new Error(`Pessoa não encontrada para presença: ${name}`)

      return {
        eventId: event.id,
        personId: person.id,
        present,
      }
    })

    if (attendanceData.length > 0) {
      await prisma.attendance.createMany({ data: attendanceData })
    }

    return event
  }

  async function createFutureEvent(groupId: string, days: number, eventTypeId = cellType.id) {
    return prisma.event.create({
      data: {
        groupId,
        eventTypeId,
        scheduledAt: daysFromNow(days),
      },
    })
  }

  await createPastEvent(esperanca.id, 7, {
    'Lucas Santos': true,
    'João Pereira': true,
    'Cláudio Mendes': false,
    'Maria Oliveira': true,
    'Helena Alves': true,
    'Bruno Costa': true,
  })
  await createPastEvent(esperanca.id, 14, {
    'Lucas Santos': true,
    'João Pereira': true,
    'Cláudio Mendes': false,
    'Maria Oliveira': false,
    'Helena Alves': true,
    'Bruno Costa': true,
  })
  await createPastEvent(esperanca.id, 21, {
    'Lucas Santos': true,
    'João Pereira': true,
    'Cláudio Mendes': true,
    'Maria Oliveira': true,
    'Helena Alves': true,
    'Bruno Costa': true,
  }, emcType.id)
  await createFutureEvent(esperanca.id, 3)

  await createPastEvent(agape.id, 6, {
    'Beatriz Lima': true,
    'Pedro Souza': true,
    'Clara Souza': false,
    'Rafael Costa': false,
    'Carla Ferreira': false,
  })
  await createPastEvent(agape.id, 13, {
    'Beatriz Lima': true,
    'Pedro Souza': true,
    'Clara Souza': true,
    'Rafael Costa': false,
    'Carla Ferreira': true,
  })
  await createFutureEvent(agape.id, 4)

  await createPastEvent(shalom.id, 5, {
    'Fernanda Lima': true,
    'Ricardo Almeida': true,
    'Juliana Costa': true,
    'Diego Martins': true,
  })
  await createPastEvent(shalom.id, 12, {
    'Fernanda Lima': true,
    'Ricardo Almeida': true,
    'Juliana Costa': true,
    'Diego Martins': true,
  })
  await createFutureEvent(shalom.id, 5)

  await createPastEvent(recomeco.id, 8, {
    'Ana Martins': false,
    'Marco Antônio': true,
    'Bruno Costa': true,
  })
  await createPastEvent(recomeco.id, 15, {
    'Ana Martins': false,
    'Marco Antônio': true,
    'Bruno Costa': true,
  })
  await createFutureEvent(recomeco.id, 6)

  console.log('📆 Eventos e presenças criados')

  await prisma.riskScore.createMany({
    data: [
      {
        personId: claudio.id,
        score: 25,
        level: 'red' satisfies RiskLevelValue,
        reasons: ['ausencias_recorrentes', 'cuidado_prioritario'],
      },
      {
        personId: maria.id,
        score: 62,
        level: 'yellow' satisfies RiskLevelValue,
        reasons: ['visitante_em_acolhimento', 'uma_ausencia_recente'],
      },
      {
        personId: rafael.id,
        score: 18,
        level: 'red' satisfies RiskLevelValue,
        reasons: ['multiplos_sinais', 'acompanhamento_vencido', 'ausencias_recorrentes'],
      },
      {
        personId: anaMartins.id,
        score: 20,
        level: 'red' satisfies RiskLevelValue,
        reasons: ['caso_sensivel', 'escalado_ao_pastor'],
      },
    ],
  })

  await prisma.interaction.createMany({
    data: [
      {
        personId: claudio.id,
        authorId: bruno.person.id,
        kind: 'call' satisfies InteractionKindValue,
        content: 'Ligou e não conseguiu falar. Precisa nova tentativa com cuidado.',
        createdAt: daysAgo(10),
      },
      {
        personId: pedro.id,
        authorId: carlaLeader.person.id,
        kind: 'visit' satisfies InteractionKindValue,
        content: 'Visita simples. Está presente, mas pediu ajuda com emprego.',
        createdAt: daysAgo(2),
      },
      {
        personId: rafael.id,
        authorId: carlaLeader.person.id,
        kind: 'whatsapp' satisfies InteractionKindValue,
        content: 'Última conversa antes das ausências recorrentes.',
        createdAt: daysAgo(35),
      },
      {
        personId: anaMartins.id,
        authorId: ana.person.id,
        kind: 'note' satisfies InteractionKindValue,
        content: 'Supervisora pediu apoio pastoral por situação familiar sensível.',
        createdAt: daysAgo(9),
      },
      {
        personId: fernanda.id,
        authorId: diego.person.id,
        kind: 'whatsapp' satisfies InteractionKindValue,
        content: 'Contato de rotina. Tudo bem com a família.',
        createdAt: daysAgo(4),
      },
    ],
  })

  const claudioNeed = await prisma.need.create({
    data: {
      personId: claudio.id,
      kind: 'prayer' satisfies NeedKindValue,
      priority: 'high' satisfies PriorityValue,
      content: 'Pedido de oração pela saúde da mãe e retorno ao convívio da célula.',
    },
  })
  const pedroNeed = await prisma.need.create({
    data: {
      personId: pedro.id,
      kind: 'social' satisfies NeedKindValue,
      priority: 'medium' satisfies PriorityValue,
      content: 'Apoio simples para recolocação profissional.',
    },
  })
  const rafaelNeed = await prisma.need.create({
    data: {
      personId: rafael.id,
      kind: 'counseling' satisfies NeedKindValue,
      priority: 'high' satisfies PriorityValue,
      content: 'Acompanhamento vencido após múltiplas ausências.',
    },
  })
  const anaMartinsNeed = await prisma.need.create({
    data: {
      personId: anaMartins.id,
      kind: 'counseling' satisfies NeedKindValue,
      priority: 'high' satisfies PriorityValue,
      content: 'Caso sensível escalado ao pastor pela supervisora.',
    },
  })

  await prisma.task.createMany({
    data: [
      {
        assigneeId: bruno.user.id,
        groupId: esperanca.id,
        needId: claudioNeed.id,
        targetType: 'person',
        targetId: claudio.id,
        description: 'Ligar para Cláudio novamente e registrar retorno.',
        dueAt: daysFromNow(2),
      },
      {
        assigneeId: carlaLeader.user.id,
        groupId: agape.id,
        needId: pedroNeed.id,
        targetType: 'person',
        targetId: pedro.id,
        description: 'Acompanhamento simples de Pedro sobre trabalho.',
        dueAt: daysFromNow(5),
      },
      {
        assigneeId: carlaLeader.user.id,
        groupId: agape.id,
        needId: rafaelNeed.id,
        targetType: 'person',
        targetId: rafael.id,
        description: 'Retomar acompanhamento de Rafael. Está vencido.',
        dueAt: daysAgo(5),
      },
      {
        assigneeId: roberto.user.id,
        groupId: recomeco.id,
        needId: anaMartinsNeed.id,
        targetType: 'person',
        targetId: anaMartins.id,
        description: 'Apoio pastoral solicitado pela supervisora Ana.',
        dueAt: daysFromNow(1),
      },
      {
        assigneeId: bruno.user.id,
        groupId: recomeco.id,
        targetType: 'group',
        targetId: recomeco.id,
        description: 'Atualizar retorno da célula Recomeço depois das ausências.',
        dueAt: daysAgo(2),
      },
      {
        assigneeId: diego.user.id,
        groupId: shalom.id,
        targetType: 'group',
        targetId: shalom.id,
        description: 'Confirmar local do próximo encontro.',
        dueAt: daysFromNow(6),
      },
    ],
  })

  await prisma.eventRecurrence.createMany({
    data: [
      {
        churchId: church.id,
        groupId: esperanca.id,
        eventTypeId: cellType.id,
        recurrence: 'weekly',
        dayOfWeek: 4,
        time: '20:00',
        startDate: daysAgo(45),
        location: 'Casa do Bruno',
      },
      {
        churchId: church.id,
        groupId: agape.id,
        eventTypeId: cellType.id,
        recurrence: 'weekly',
        dayOfWeek: 3,
        time: '20:00',
        startDate: daysAgo(45),
        location: 'Casa da Carla',
      },
      {
        churchId: church.id,
        groupId: shalom.id,
        eventTypeId: cellType.id,
        recurrence: 'weekly',
        dayOfWeek: 5,
        time: '19:30',
        startDate: daysAgo(45),
        location: 'Casa do Diego',
      },
      {
        churchId: church.id,
        groupId: recomeco.id,
        eventTypeId: cellType.id,
        recurrence: 'weekly',
        dayOfWeek: 2,
        time: '20:00',
        startDate: daysAgo(45),
        location: 'Casa da família Recomeço',
      },
      {
        churchId: church.id,
        groupId: esperanca.id,
        eventTypeId: emcType.id,
        recurrence: 'monthly',
        dayOfWeek: 0,
        time: '18:00',
        startDate: daysAgo(45),
        location: 'Templo Central',
      },
    ],
  })

  await prisma.consentLog.createMany({
    data: [
      { personId: roberto.person.id, kind: 'data_usage', granted: true, ip: '127.0.0.1' },
      { personId: ana.person.id, kind: 'data_usage', granted: true },
      { personId: marta.person.id, kind: 'data_usage', granted: true },
      { personId: bruno.person.id, kind: 'data_usage', granted: true },
      { personId: carlaLeader.person.id, kind: 'data_usage', granted: true },
      { personId: diego.person.id, kind: 'data_usage', granted: true },
      { personId: helenaHost.person.id, kind: 'data_usage', granted: true },
      { personId: lucas.id, kind: 'data_usage', granted: true },
    ],
  })

  await prisma.auditLog.createMany({
    data: [
      {
        userId: roberto.user.id,
        churchId: church.id,
        action: 'create',
        resource: 'person',
        resourceId: lucas.id,
        details: 'Seed validação: pessoa estável, presença boa, sem sinais ativos.',
        ip: '127.0.0.1',
      },
      {
        userId: ana.user.id,
        churchId: church.id,
        action: 'create',
        resource: 'person',
        resourceId: anaMartins.id,
        details: 'Seed validação: caso sensível escalado ao pastor.',
      },
      {
        userId: carlaLeader.user.id,
        churchId: church.id,
        action: 'create',
        resource: 'task',
        resourceId: rafael.id,
        details: 'Seed validação: acompanhamento vencido e múltiplos sinais.',
      },
    ],
  })

  console.log('\n🎉 Seed de validação pastoral concluída!')
  console.log('\nUsuários de teste:')
  console.log('  roberto@comunidadeesperanca.org (pastor)')
  console.log('  ana@comunidadeesperanca.org (supervisora com células em atenção)')
  console.log('  marta@comunidadeesperanca.org (supervisora com célula saudável)')
  console.log('  bruno@comunidadeesperanca.org (líder)')
  console.log('  carla@comunidadeesperanca.org (líder com acompanhamento vencido)')
  console.log('  diego@comunidadeesperanca.org (líder com célula saudável)')
  console.log('  helena@comunidadeesperanca.org (anfitriã)')
  console.log('  lucas@comunidadeesperanca.org (membro estável)')
  console.log('  Senha comum: koinonia123')

  console.log('\nCenários cobertos:')
  console.log('  Lucas Santos: presença boa, sem sinais ativos e sem histórico pastoral.')
  console.log('  João Pereira: sem telefone cadastrado, mas sem demanda pastoral.')
  console.log('  Cláudio Mendes: ausências recorrentes e cuidado prioritário.')
  console.log('  Maria Oliveira: visitante/novo convertido em atenção inicial.')
  console.log('  Pedro Souza: acompanhamento simples aberto, sem gravidade pastoral.')
  console.log('  Rafael Costa: múltiplos sinais e acompanhamento vencido.')
  console.log('  Ana Martins: caso sensível escalado ao pastor.')
  console.log('  Shalom: célula saudável para validar estado tranquilo.')
}

main()
  .catch((error) => {
    console.error('❌ Erro no seed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
