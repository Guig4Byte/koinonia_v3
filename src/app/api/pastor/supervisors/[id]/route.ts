import { NextResponse } from "next/server";
import { domainErrorResponse, serverErrorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/get-current-user";
import { requireRole } from "@/lib/role-guard";
import prisma from "@/lib/prisma";
import { writeAuditLog, extractIp } from "@/app/api/_helpers/audit-log";

interface PastoralRiskScore {
  level: "green" | "yellow" | "red";
  reasons: string[];
}

function hasPastoralAttention(riskScore: PastoralRiskScore | null): boolean {
  const reasons = riskScore?.reasons ?? [];

  return (
    riskScore?.level === "red" ||
    reasons.includes("escalado_ao_pastor") ||
    reasons.includes("caso_sensivel") ||
    reasons.includes("multiplos_sinais") ||
    reasons.includes("acompanhamento_vencido")
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getCurrentUser(request);

    if (!user) {
      return domainErrorResponse("UNAUTHORIZED");
    }

    const roleCheck = requireRole(user.role, ["pastor"]);
    if (!roleCheck.authorized) {
      return domainErrorResponse(roleCheck.error);
    }

    const { id: supervisorUserId } = await params;
    const now = new Date();

    const supervisor = await prisma.user.findFirst({
      where: {
        id: supervisorUserId,
        churchId: user.churchId,
        role: "supervisor",
        deletedAt: null,
        person: { deletedAt: null },
      },
      select: {
        id: true,
        person: { select: { id: true, name: true, photoUrl: true } },
      },
    });

    if (!supervisor) {
      return domainErrorResponse("USER_NOT_FOUND");
    }

    const groups = await prisma.group.findMany({
      where: {
        churchId: user.churchId,
        supervisorUserId: supervisor.id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        leaderUserId: true,
        memberships: {
          where: { leftAt: null, person: { deletedAt: null } },
          select: {
            person: {
              select: {
                id: true,
                name: true,
                photoUrl: true,
                riskScore: { select: { level: true, reasons: true } },
              },
            },
          },
        },
        events: {
          where: { deletedAt: null },
          orderBy: { scheduledAt: "desc" },
          take: 6,
          select: {
            attendances: {
              where: { person: { deletedAt: null } },
              select: { present: true },
            },
            occurredAt: true,
          },
        },
      },
    });

    const leaderUserIds = groups
      .map((group) => group.leaderUserId)
      .filter((id): id is string => id !== null);

    const leaders = await prisma.user.findMany({
      where: {
        id: { in: leaderUserIds },
        deletedAt: null,
        person: { deletedAt: null },
      },
      select: { id: true, person: { select: { name: true } } },
    });

    const leaderNameMap = new Map<string, string>();
    leaders.forEach((leader) => {
      if (leader.person?.name) {
        leaderNameMap.set(leader.id, leader.person.name);
      }
    });

    const overdueTasks = await prisma.task.findMany({
      where: {
        group: {
          churchId: user.churchId,
          supervisorUserId: supervisor.id,
          deletedAt: null,
        },
        assignee: { deletedAt: null, person: { deletedAt: null } },
        completedAt: null,
        dueAt: { lt: now },
        deletedAt: null,
      },
      select: {
        id: true,
        description: true,
        dueAt: true,
        assignee: { select: { id: true, person: { select: { name: true } } } },
        group: { select: { id: true, name: true } },
      },
    });

    const groupDetails = groups.map((group) => {
      const members = group.memberships.map((membership) => membership.person);
      const memberCount = members.length;
      const atRiskMembers = members.filter((member) => hasPastoralAttention(member.riskScore));

      let groupAttendances = 0;
      let groupPossible = 0;
      group.events.forEach((event) => {
        groupAttendances += event.attendances.filter((attendance) => attendance.present).length;
        groupPossible += event.attendances.length;
      });

      const avgAttendance =
        groupPossible > 0
          ? Math.round((groupAttendances / groupPossible) * 100)
          : 0;

      const pastEvents = group.events.filter(
        (event) => event.occurredAt && new Date(event.occurredAt) < now,
      );

      return {
        id: group.id,
        name: group.name,
        memberCount,
        atRiskCount: atRiskMembers.length,
        averageAttendance: avgAttendance,
        lastAttendanceRate:
          pastEvents.length > 0 && pastEvents[0]!.attendances.length > 0
            ? Math.round(
                (pastEvents[0]!.attendances.filter((attendance) => attendance.present).length /
                  pastEvents[0]!.attendances.length) *
                  100,
              )
            : null,
        supervisorName: supervisor.person?.name ?? null,
        leaderName: group.leaderUserId
          ? (leaderNameMap.get(group.leaderUserId) ?? null)
          : null,
        leaderUserId: group.leaderUserId,
      };
    });

    await writeAuditLog({
      userId: user.userId,
      churchId: user.churchId,
      action: "read",
      resource: "person",
      resourceId: supervisorUserId,
      details: `Perfil pastoral da supervisão: ${supervisor.person?.name}`,
      ip: extractIp(request),
    });

    return NextResponse.json({
      supervisor: {
        id: supervisor.id,
        name: supervisor.person?.name ?? "Supervisor",
        photoUrl: supervisor.person?.photoUrl ?? null,
      },
      groups: groupDetails,
      overdueTasks: overdueTasks.map((task) => ({
        id: task.id,
        description: task.description,
        dueAt: task.dueAt,
        assigneeName: task.assignee.person?.name ?? "Líder",
        groupName: task.group?.name ?? null,
      })),
    });
  } catch (error) {
    console.error("GET /api/pastor/supervisors/[id] failed", error);
    return serverErrorResponse();
  }
}
