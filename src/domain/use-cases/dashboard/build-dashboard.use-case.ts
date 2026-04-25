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
  riskScore: { level: "green" | "yellow" | "red" } | null;
  interactionsAsSubject: Array<{ createdAt: Date }>;
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
  leaderId: string | null;
  supervisorId: string | null;
  memberships: DashboardMembership[];
  events: DashboardEvent[];
}

interface OverdueTask {
  assignee: {
    id: string;
    person?: { name: string | null } | null;
  };
}

function isAtRisk(person: DashboardPerson): boolean {
  return person.riskScore?.level === "red" || person.riskScore?.level === "yellow";
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

export function buildDashboard(
  groups: DashboardGroup[],
  overdueTasks: OverdueTask[],
  userNameMap: Map<string, string>,
): DashboardResult {
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

    const atRiskMembers = members.filter(isAtRisk);
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

    // Alerta: membros em risco sem contato recente
    atRiskMembers.forEach((member) => {
      if (alertedPersonIds.has(member.id)) return;

      const lastContact = member.interactionsAsSubject[0]?.createdAt;
      const daysSinceContact = lastContact ? daysSince(lastContact) : Infinity;

      if (daysSinceContact > 7 || daysSinceContact === Infinity) {
        alertedPersonIds.add(member.id);
        alerts.push({
          id: `risk-${member.id}`,
          type: "member_at_risk_no_contact",
          severity: daysSinceContact === Infinity ? "high" : "medium",
          title: `${member.name} está em risco`,
          description:
            daysSinceContact === Infinity
              ? `Sem contato registrado.`
              : `Sem contato há ${daysSinceContact} dias.`,
          groupId: group.id,
          groupName: group.name,
          personId: member.id,
          personName: member.name,
        });
      }
    });

    // Alerta: presença não registrada
    if (pastEvents.length > 0) {
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
      supervisorName: group.supervisorId
        ? (userNameMap.get(group.supervisorId) ?? null)
        : null,
      leaderName: group.leaderId
        ? (userNameMap.get(group.leaderId) ?? null)
        : null,
    };
  });

  // Alerta: líder com tasks vencidas
  const leaderOverdueMap = new Map<string, { name: string; count: number }>();
  overdueTasks.forEach((task) => {
    const leaderId = task.assignee.id;
    const existing = leaderOverdueMap.get(leaderId);
    if (existing) {
      existing.count += 1;
    } else {
      leaderOverdueMap.set(leaderId, {
        name: task.assignee.person?.name ?? "Líder",
        count: 1,
      });
    }
  });

  leaderOverdueMap.forEach((data, leaderId) => {
    alerts.push({
      id: `overdue-${leaderId}`,
      type: "leader_overdue_tasks",
      severity: data.count >= 3 ? "high" : "medium",
      title: `${data.name}: ${data.count} tarefa(s) atrasada(s)`,
      description: `O líder tem ${data.count} tarefa(s) pendente(s) além do prazo.`,
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
