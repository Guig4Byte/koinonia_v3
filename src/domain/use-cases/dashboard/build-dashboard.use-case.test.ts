import { describe, it, expect } from "vitest";
import { buildDashboard } from "./build-dashboard.use-case";

function createGroup(overrides: {
  id?: string;
  name?: string;
  leaderUserId?: string | null;
  supervisorUserId?: string | null;
  memberships?: Array<{
    person: {
      id: string;
      name: string;
      riskScore: { level: "green" | "yellow" | "red" } | null;
      interactionsAsSubject: Array<{ createdAt: Date }>;
    };
  }>;
  events?: Array<{
    occurredAt: Date | null;
    attendances: Array<{ present: boolean }>;
  }>;
}) {
  return {
    id: overrides.id ?? "group-1",
    name: overrides.name ?? "Célula Teste",
    leaderUserId: overrides.leaderUserId ?? "leader-1",
    supervisorUserId: overrides.supervisorUserId ?? null,
    memberships: overrides.memberships ?? [],
    events: overrides.events ?? [],
  };
}

describe("buildDashboard", () => {
  it("retorna dashboard vazio quando não há grupos", () => {
    const result = buildDashboard([], [], new Map());

    expect(result.summary.totalGroups).toBe(0);
    expect(result.summary.totalMembers).toBe(0);
    expect(result.summary.averageAttendance).toBe(0);
    expect(result.summary.atRiskCount).toBe(0);
    expect(result.summary.overdueTasksCount).toBe(0);
    expect(result.groups).toHaveLength(0);
    expect(result.alerts).toHaveLength(0);
  });

  it("calcula métricas básicas corretamente", () => {
    const group = createGroup({
      memberships: [
        {
          person: {
            id: "p1",
            name: "Ana",
            riskScore: { level: "green" },
            interactionsAsSubject: [],
          },
        },
        {
          person: {
            id: "p2",
            name: "Bruno",
            riskScore: { level: "green" },
            interactionsAsSubject: [],
          },
        },
      ],
      events: [
        {
          occurredAt: new Date("2024-01-01"),
          attendances: [{ present: true }, { present: true }],
        },
      ],
    });

    const result = buildDashboard([group], [], new Map());

    expect(result.summary.totalGroups).toBe(1);
    expect(result.summary.totalMembers).toBe(2);
    expect(result.summary.averageAttendance).toBe(100);
    expect(result.summary.atRiskCount).toBe(0);
    expect(result.groups[0]?.memberCount).toBe(2);
    expect(result.groups[0]?.averageAttendance).toBe(100);
    expect(result.groups[0]?.lastAttendanceRate).toBe(100);
  });

  it("detecta membro em risco (red/yellow)", () => {
    const group = createGroup({
      memberships: [
        {
          person: {
            id: "p1",
            name: "Ana",
            riskScore: { level: "red" },
            interactionsAsSubject: [{ createdAt: new Date() }],
          },
        },
        {
          person: {
            id: "p2",
            name: "Bruno",
            riskScore: { level: "yellow" },
            interactionsAsSubject: [{ createdAt: new Date() }],
          },
        },
      ],
      events: [],
    });

    const result = buildDashboard([group], [], new Map());

    expect(result.summary.atRiskCount).toBe(2);
    expect(result.groups[0]?.atRiskCount).toBe(2);
  });

  it("gera alerta de 0% de presença", () => {
    const group = createGroup({
      memberships: [
        {
          person: {
            id: "p1",
            name: "Ana",
            riskScore: null,
            interactionsAsSubject: [],
          },
        },
      ],
      events: [
        {
          occurredAt: new Date("2024-01-01"),
          attendances: [{ present: false }],
        },
      ],
    });

    const result = buildDashboard([group], [], new Map());

    const zeroAlert = result.alerts.find((a) => a.type === "zero_attendance");
    expect(zeroAlert).toBeDefined();
    expect(zeroAlert!.severity).toBe("high");
  });

  it("gera alerta de presença baixa (<50%)", () => {
    const group = createGroup({
      memberships: [
        {
          person: {
            id: "p1",
            name: "Ana",
            riskScore: null,
            interactionsAsSubject: [],
          },
        },
        {
          person: {
            id: "p2",
            name: "Bruno",
            riskScore: null,
            interactionsAsSubject: [],
          },
        },
        {
          person: {
            id: "p3",
            name: "Carlos",
            riskScore: null,
            interactionsAsSubject: [],
          },
        },
      ],
      events: [
        {
          occurredAt: new Date("2024-01-01"),
          attendances: [{ present: false }, { present: false }, { present: true }],
        },
      ],
    });

    const result = buildDashboard([group], [], new Map());

    const lowAlert = result.alerts.find((a) => a.type === "low_attendance");
    expect(lowAlert).toBeDefined();
    expect(lowAlert!.severity).toBe("medium");
    expect(lowAlert!.title).toContain("33%");
  });

  it("gera alerta de membro em risco sem contato", () => {
    const group = createGroup({
      memberships: [
        {
          person: {
            id: "p1",
            name: "Ana",
            riskScore: { level: "red" },
            interactionsAsSubject: [],
          },
        },
      ],
      events: [],
    });

    const result = buildDashboard([group], [], new Map());

    const riskAlert = result.alerts.find(
      (a) => a.type === "member_at_risk_no_contact",
    );
    expect(riskAlert).toBeDefined();
    expect(riskAlert!.severity).toBe("high");
    expect(riskAlert!.title).toContain("Ana");
  });

  it("não gera alerta de risco se contato foi há menos de 7 dias", () => {
    const group = createGroup({
      memberships: [
        {
          person: {
            id: "p1",
            name: "Ana",
            riskScore: { level: "red" },
            interactionsAsSubject: [{ createdAt: new Date() }],
          },
        },
      ],
      events: [],
    });

    const result = buildDashboard([group], [], new Map());

    const riskAlert = result.alerts.find(
      (a) => a.type === "member_at_risk_no_contact",
    );
    expect(riskAlert).toBeUndefined();
  });

  it("gera alerta de presença não registrada", () => {
    const group = createGroup({
      memberships: [
        {
          person: {
            id: "p1",
            name: "Ana",
            riskScore: null,
            interactionsAsSubject: [],
          },
        },
      ],
      events: [
        {
          occurredAt: new Date("2024-01-01"),
          attendances: [],
        },
      ],
    });

    const result = buildDashboard([group], [], new Map());

    const unregAlert = result.alerts.find(
      (a) => a.type === "unregistered_attendance",
    );
    expect(unregAlert).toBeDefined();
    expect(unregAlert!.severity).toBe("medium");
  });

  it("gera alerta de tasks vencidas do líder", () => {
    const group = createGroup({ events: [], memberships: [] });

    const overdueTasks = [
      {
        assignee: {
          id: "leader-1",
          person: { name: "Bruno" },
        },
      },
    ];

    const result = buildDashboard([group], overdueTasks, new Map());

    const overdueAlert = result.alerts.find(
      (a) => a.type === "leader_overdue_tasks",
    );
    expect(overdueAlert).toBeDefined();
    expect(overdueAlert!.severity).toBe("medium");
    expect(overdueAlert!.title).toContain("Bruno");
  });

  it("escala severidade para high quando líder tem 3+ tasks atrasadas", () => {
    const group = createGroup({ events: [], memberships: [] });

    const overdueTasks = [
      { assignee: { id: "leader-1", person: { name: "Bruno" } } },
      { assignee: { id: "leader-1", person: { name: "Bruno" } } },
      { assignee: { id: "leader-1", person: { name: "Bruno" } } },
    ];

    const result = buildDashboard([group], overdueTasks, new Map());

    const overdueAlert = result.alerts.find(
      (a) => a.type === "leader_overdue_tasks",
    );
    expect(overdueAlert!.severity).toBe("high");
  });

  it("ordena alertas por severidade (high primeiro)", () => {
    const group = createGroup({
      memberships: [
        {
          person: {
            id: "p1",
            name: "Ana",
            riskScore: { level: "red" },
            interactionsAsSubject: [],
          },
        },
      ],
      events: [
        {
          occurredAt: new Date("2024-01-01"),
          attendances: [{ present: false }],
        },
      ],
    });

    const result = buildDashboard([group], [], new Map());

    expect(result.alerts[0]?.severity).toBe("high");
  });

  it("limita a 10 alertas no máximo", () => {
    const memberships = Array.from({ length: 15 }, (_, i) => ({
      person: {
        id: `p${i}`,
        name: `Membro ${i}`,
        riskScore: { level: "red" as const },
        interactionsAsSubject: [],
      },
    }));

    const group = createGroup({ memberships, events: [] });

    const result = buildDashboard([group], [], new Map());

    expect(result.alerts.length).toBeLessThanOrEqual(10);
  });

  it("usa userNameMap para preencher nomes de líder e supervisor", () => {
    const group = createGroup({
      leaderUserId: "leader-1",
      supervisorUserId: "sup-1",
      events: [],
      memberships: [],
    });

    const nameMap = new Map([
      ["leader-1", "Bruno"],
      ["sup-1", "Ana"],
    ]);

    const result = buildDashboard([group], [], nameMap);

    expect(result.groups[0]?.leaderName).toBe("Bruno");
    expect(result.groups[0]?.supervisorName).toBe("Ana");
  });

  it("não duplica alerta para mesmo membro em risco em grupos diferentes", () => {
    const person = {
      id: "p1",
      name: "Ana",
      riskScore: { level: "red" as const },
      interactionsAsSubject: [],
    };

    const group1 = createGroup({
      id: "g1",
      memberships: [{ person }],
      events: [],
    });
    const group2 = createGroup({
      id: "g2",
      memberships: [{ person }],
      events: [],
    });

    const result = buildDashboard([group1, group2], [], new Map());

    const riskAlerts = result.alerts.filter(
      (a) => a.type === "member_at_risk_no_contact",
    );
    expect(riskAlerts).toHaveLength(1);
  });
});
