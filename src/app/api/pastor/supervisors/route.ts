import { NextResponse } from "next/server";
import { domainErrorResponse, serverErrorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/get-current-user";
import { requireRole } from "@/lib/role-guard";
import prisma from "@/lib/prisma";
import { writeAuditLog, extractIp } from "@/app/api/_helpers/audit-log";

export async function GET(request: Request) {
  try {
    const user = getCurrentUser(request);

    if (!user) {
      return domainErrorResponse("UNAUTHORIZED");
    }

    const roleCheck = requireRole(user.role, ["pastor"]);
    if (!roleCheck.authorized) {
      return domainErrorResponse(roleCheck.error);
    }

    const now = new Date();

    // Busca todos os supervisores da igreja
    const supervisors = await prisma.user.findMany({
      where: {
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

    // Busca todos os grupos da igreja com dados necessários
    const groups = await prisma.group.findMany({
      where: { churchId: user.churchId, deletedAt: null },
      select: {
        id: true,
        name: true,
        supervisorUserId: true,
        leaderUserId: true,
        memberships: {
          where: { leftAt: null, person: { deletedAt: null } },
          select: {
            person: {
              select: {
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

    // Busca tasks vencidas dos líderes
    const overdueTasks = await prisma.task.findMany({
      where: {
        group: { churchId: user.churchId, deletedAt: null },
        assignee: { deletedAt: null, person: { deletedAt: null } },
        completedAt: null,
        dueAt: { lt: now },
        deletedAt: null,
      },
      select: {
        assigneeId: true,
        groupId: true,
      },
    });

    const result = supervisors.map((supervisor) => {
      const supervisedGroups = groups.filter(
        (g) => g.supervisorUserId === supervisor.id,
      );

      let totalMembers = 0;
      let totalAttendances = 0;
      let totalPossible = 0;
      let atRiskCount = 0;
      let overdueTasksCount = 0;
      const leaderUserIds = new Set<string>();

      supervisedGroups.forEach((group) => {
        totalMembers += group.memberships.length;

        group.memberships.forEach((m) => {
          if (
            m.person.riskScore?.level === "red" ||
            m.person.riskScore?.level === "yellow"
          ) {
            atRiskCount++;
          }
        });

        group.events.forEach((event) => {
          totalAttendances += event.attendances.filter((a) => a.present).length;
          totalPossible += event.attendances.length;
        });

        if (group.leaderUserId) {
          leaderUserIds.add(group.leaderUserId);
        }
      });

      // Conta tasks vencidas dos líderes desses grupos
      overdueTasks.forEach((task) => {
        if (leaderUserIds.has(task.assigneeId)) {
          overdueTasksCount++;
        }
      });

      const averageAttendance =
        totalPossible > 0
          ? Math.round((totalAttendances / totalPossible) * 100)
          : 0;

      return {
        id: supervisor.id,
        name: supervisor.person?.name ?? "Supervisor",
        photoUrl: supervisor.person?.photoUrl ?? null,
        groupCount: supervisedGroups.length,
        totalMembers,
        averageAttendance,
        atRiskCount,
        overdueTasksCount,
      };
    });

    await writeAuditLog({
      userId: user.userId,
      churchId: user.churchId,
      action: "read",
      resource: "person",
      resourceId: user.churchId,
      details: "Lista de supervisores",
      ip: extractIp(request),
    });

    return NextResponse.json({ supervisors: result });
  } catch (error) {
    console.error("GET /api/pastor/supervisors failed", error);
    return serverErrorResponse();
  }
}
