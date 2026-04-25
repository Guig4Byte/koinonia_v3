import { NextResponse } from "next/server";
import { domainErrorResponse, serverErrorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/get-current-user";
import { requireRole } from "@/lib/role-guard";
import prisma from "@/lib/prisma";
import { writeAuditLog, extractIp } from "@/app/api/_helpers/audit-log";

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

    const { id: supervisorId } = await params;
    const now = new Date();

    // Busca o supervisor
    const supervisor = await prisma.user.findFirst({
      where: {
        id: supervisorId,
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

    // Busca grupos supervisionados
    const groups = await prisma.group.findMany({
      where: {
        churchId: user.churchId,
        supervisorId: supervisor.id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        leaderId: true,
        memberships: {
          where: { leftAt: null, person: { deletedAt: null } },
          select: {
            person: {
              select: {
                id: true,
                name: true,
                photoUrl: true,
                riskScore: { select: { level: true } },
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

    // Busca nomes dos líderes
    const leaderIds = groups
      .map((g) => g.leaderId)
      .filter((id): id is string => id !== null);

    const leaders = await prisma.user.findMany({
      where: {
        id: { in: leaderIds },
        deletedAt: null,
        person: { deletedAt: null },
      },
      select: { id: true, person: { select: { name: true } } },
    });

    const leaderNameMap = new Map<string, string>();
    leaders.forEach((l) => {
      if (l.person?.name) leaderNameMap.set(l.id, l.person.name);
    });

    // Busca tasks vencidas dos líderes desses grupos
    const overdueTasks = await prisma.task.findMany({
      where: {
        group: {
          churchId: user.churchId,
          supervisorId: supervisor.id,
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
      const members = group.memberships.map((m) => m.person);
      const memberCount = members.length;
      const atRiskMembers = members.filter(
        (m) => m.riskScore?.level === "red" || m.riskScore?.level === "yellow",
      );

      let groupAttendances = 0;
      let groupPossible = 0;
      group.events.forEach((event) => {
        groupAttendances += event.attendances.filter((a) => a.present).length;
        groupPossible += event.attendances.length;
      });

      const avgAttendance =
        groupPossible > 0
          ? Math.round((groupAttendances / groupPossible) * 100)
          : 0;

      const pastEvents = group.events.filter(
        (e) => e.occurredAt && new Date(e.occurredAt) < now,
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
                (pastEvents[0]!.attendances.filter((a) => a.present).length /
                  pastEvents[0]!.attendances.length) *
                  100,
              )
            : null,
        supervisorName: supervisor.person?.name ?? null,
        leaderName: group.leaderId
          ? (leaderNameMap.get(group.leaderId) ?? null)
          : null,
        leaderId: group.leaderId,
      };
    });

    await writeAuditLog({
      userId: user.userId,
      churchId: user.churchId,
      action: "read",
      resource: "person",
      resourceId: supervisorId,
      details: `Perfil do supervisor: ${supervisor.person?.name}`,
      ip: extractIp(request),
    });

    return NextResponse.json({
      supervisor: {
        id: supervisor.id,
        name: supervisor.person?.name ?? "Supervisor",
        photoUrl: supervisor.person?.photoUrl ?? null,
      },
      groups: groupDetails,
      overdueTasks: overdueTasks.map((t) => ({
        id: t.id,
        description: t.description,
        dueAt: t.dueAt,
        assigneeName: t.assignee.person?.name ?? "Líder",
        groupName: t.group?.name ?? null,
      })),
    });
  } catch (error) {
    console.error("GET /api/pastor/supervisors/[id] failed", error);
    return serverErrorResponse();
  }
}
