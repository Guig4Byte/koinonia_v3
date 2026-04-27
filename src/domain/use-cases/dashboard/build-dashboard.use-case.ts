export interface DashboardAlert {
  id: string;
  type: string;
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  groupId?: string;
  groupName?: string;
  personId?: string;
  personName?: string;
}

export interface DashboardSummary {
  totalGroups: number;
  totalMembers: number;
  averageAttendance: number;
  atRiskCount: number;
  overdueTasksCount: number;
}

export interface GroupSummary {
  id: string;
  name: string;
  memberCount: number;
  atRiskCount: number;
  averageAttendance: number;
  lastAttendanceRate: number | null;
  supervisorName: string | null;
  leaderName: string | null;
}

export interface DashboardResult {
  summary: DashboardSummary;
  groups: GroupSummary[];
  alerts: DashboardAlert[];
}

interface DashboardPerson {
  id: string;
  name: string;
  riskScore: { level: "green" | "yellow" | "red"; reasons?: string[] } | null;
  interactionsAsSubject: Array<{ createdAt: Date }>;
}

type DashboardAudience = "pastor" | "supervisor";

interface BuildDashboardOptions {
  audience?: DashboardAudience;
}

interface DashboardMembership {
  person: DashboardPerson;
}

interface DashboardEvent {
  occurredAt: Date | null;
  attendances: Array<{ present: boolean }>;
}

interface DashboardGroup {
  id: string;
  name: string;
  leaderUserId: string | null;
  supervisorUserId: string | null;
  memberships: DashboardMembership[];
  events: DashboardEvent[];
}

interface OverdueTask {
  assignee: {
    id: string;
    person?: { name: string | null } | null;
  };
}

function hasPastoralAttention(person: DashboardPerson): boolean {
  const riskScore = person.riskScore;
  const reasons = riskScore?.reasons ?? [];

  return (
    riskScore?.level === "red" ||
    reasons.includes("escalado_ao_pastor") ||
    reasons.includes("caso_sensivel") ||
    reasons.includes("multiplos_sinais") ||
    reasons.includes("acompanhamento_vencido")
  );
}

function isAtRisk(person: DashboardPerson, audience: DashboardAudience): boolean {
  if (audience === "pastor") {
    return hasPastoralAttention(person);
  }

  return person.riskScore?.level === "red" || person.riskScore?.level === "yellow";
}

function getPastoralAttentionDescription(person: DashboardPerson, daysSinceContact: number): string {
  const reasons = person.riskScore?.reasons ?? [];

  if (reasons.includes("escalado_ao_pastor") || reasons.includes("caso_sensivel")) {
    return "Caso sensível escalado para atenção pastoral.";
  }

  if (reasons.includes("acompanhamento_vencido")) {
    return "Acompanhamento vencido depois de sinais acumulados.";
  }

  if (reasons.includes("multiplos_sinais")) {
    return "Múltiplos sinais se acumularam e pedem discernimento pastoral.";
  }

  if (daysSinceContact === Infinity) {
    return "Cuidado prioritário sem retorno pastoral registrado.";
  }

  if (daysSinceContact > 7) {
    return `Cuidado prioritário com último retorno registrado há ${daysSinceContact} dias.`;
  }

  return "Cuidado prioritário acompanhado pela liderança.";
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

export function buildDashboard(
  groups: DashboardGroup[],
  overdueTasks: OverdueTask[],
  userNameMap: Map<string, string>,
  options: BuildDashboardOptions = {},
): DashboardResult {
  const audience = options.audience ?? "supervisor";
  const alerts: DashboardAlert[] = [];
  const alertedPersonIds = new Set<string>();
  const atRiskPersonIds = new Set<string>();

  let totalMembers = 0;
  let totalAttendances = 0;
  let totalPossible = 0;
  const now = new Date();

  const groupSummaries = groups.map((group) => {
    const members = group.memberships.map((m) => m.person);
    const memberCount = members.length;
    totalMembers += memberCount;

    const atRiskMembers = members.filter((member) => isAtRisk(member, audience));
    atRiskMembers.forEach((m) => atRiskPersonIds.add(m.id));

    let groupAttendances = 0;
    let groupPossible = 0;
    group.events.forEach((event) => {
      groupAttendances += event.attendances.filter((a) => a.present).length;
      groupPossible += event.attendances.length;
    });
    totalAttendances += groupAttendances;
    totalPossible += groupPossible;

    const avgAttendance =
      groupPossible > 0 ? Math.round((groupAttendances / groupPossible) * 100) : 0;

    const pastEvents = group.events.filter(
      (e) => e.occurredAt && new Date(e.occurredAt) < now,
    );

    // Alerta: queda de presença
    if (pastEvents.length > 0) {
      const latestEvent = pastEvents[0]!;
      const latestAttendance =
        latestEvent.attendances.length > 0
          ? Math.round(
              (latestEvent.attendances.filter((a) => a.present).length /
                latestEvent.attendances.length) *
                100,
            )
          : 0;

      if (latestAttendance === 0 && latestEvent.attendances.length > 0) {
        alerts.push({
          id: `zero-${group.id}`,
          type: "zero_attendance",
          severity: "high",
          title: `${group.name}: 0% de presença`,
          description: `Nenhum membro presente na última reunião.`,
          groupId: group.id,
          groupName: group.name,
        });
      } else if (latestAttendance < 50) {
        alerts.push({
          id: `low-${group.id}`,
          type: "low_attendance",
          severity: "medium",
          title: `${group.name}: ${latestAttendance}% de presença`,
          description: `Presença abaixo de 50% na última reunião.`,
          groupId: group.id,
          groupName: group.name,
        });
      }
    }

    // Alerta: pessoas em cuidado.
    // Para o pastor, só sobe atenção qualificada: grave, acumulada, sensível,
    // vencida ou escalada. "Sem contato" isolado não é motivo pastoral suficiente.
    atRiskMembers.forEach((member) => {
      if (alertedPersonIds.has(member.id)) return;

      const lastContact = member.interactionsAsSubject[0]?.createdAt;
      const daysSinceContact = lastContact ? daysSince(lastContact) : Infinity;

      if (audience === "pastor") {
        alertedPersonIds.add(member.id);
        alerts.push({
          id: `pastoral-${member.id}`,
          type: "pastoral_attention",
          severity: member.riskScore?.level === "red" ? "high" : "medium",
          title: `${member.name} pede atenção pastoral`,
          description: getPastoralAttentionDescription(member, daysSinceContact),
          groupId: group.id,
          groupName: group.name,
          personId: member.id,
          personName: member.name,
        });
        return;
      }

      if (daysSinceContact > 7 || daysSinceContact === Infinity) {
        alertedPersonIds.add(member.id);
        alerts.push({
          id: `risk-${member.id}`,
          type: "member_at_risk_no_contact",
          severity: daysSinceContact === Infinity ? "high" : "medium",
          title: `${member.name} está em risco`,
          description:
            daysSinceContact === Infinity
              ? "Sem retorno registrado depois do sinal."
              : `Sem retorno registrado há ${daysSinceContact} dias depois do sinal.`,
          groupId: group.id,
          groupName: group.name,
          personId: member.id,
          personName: member.name,
        });
      }
    });

    // Alerta operacional: presença não registrada fica na supervisão, não na fila do pastor.
    if (audience !== "pastor" && pastEvents.length > 0) {
      const latestEvent = pastEvents[0]!;
      if (
        latestEvent.attendances.length === 0 &&
        latestEvent.occurredAt &&
        new Date(latestEvent.occurredAt) < now
      ) {
        alerts.push({
          id: `unreg-${group.id}`,
          type: "unregistered_attendance",
          severity: "medium",
          title: `${group.name}: presença não registrada`,
          description: `O líder não registrou presença da última reunião.`,
          groupId: group.id,
          groupName: group.name,
        });
      }
    }

    return {
      id: group.id,
      name: group.name,
      memberCount,
      atRiskCount: atRiskMembers.length,
      averageAttendance: avgAttendance,
      lastAttendanceRate:
        pastEvents.length > 0 && pastEvents[0]!.attendances.length > 0
          ? Math.round(
              (pastEvents[0]!.attendances.filter((a) => a.present).length /
                pastEvents[0]!.attendances.length) *
                100,
            )
          : null,
      supervisorName: group.supervisorUserId
        ? (userNameMap.get(group.supervisorUserId) ?? null)
        : null,
      leaderName: group.leaderUserId
        ? (userNameMap.get(group.leaderUserId) ?? null)
        : null,
    };
  });

  // Alerta: líder com tasks vencidas
  const leaderOverdueMap = new Map<string, { name: string; count: number }>();
  overdueTasks.forEach((task) => {
    const leaderUserId = task.assignee.id;
    const existing = leaderOverdueMap.get(leaderUserId);
    if (existing) {
      existing.count += 1;
    } else {
      leaderOverdueMap.set(leaderUserId, {
        name: task.assignee.person?.name ?? "Líder",
        count: 1,
      });
    }
  });

  leaderOverdueMap.forEach((data, leaderUserId) => {
    if (audience === "pastor" && data.count < 2) {
      return;
    }

    alerts.push({
      id: `overdue-${leaderUserId}`,
      type: "leader_overdue_tasks",
      severity: data.count >= 3 ? "high" : "medium",
      title: `${data.name}: ${data.count} retorno(s) atrasado(s)`,
      description: `A liderança tem ${data.count} retorno(s) pendente(s) além do prazo.`,
    });
  });

  const severityOrder = { high: 0, medium: 1, low: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    summary: {
      totalGroups: groups.length,
      totalMembers,
      averageAttendance:
        totalPossible > 0 ? Math.round((totalAttendances / totalPossible) * 100) : 0,
      atRiskCount: atRiskPersonIds.size,
      overdueTasksCount: overdueTasks.length,
    },
    groups: groupSummaries,
    alerts: alerts.slice(0, 10),
  };
}
