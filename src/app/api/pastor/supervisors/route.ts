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
        (group) => group.supervisorUserId === supervisor.id,
      );

      let totalMembers = 0;
      let atRiskCount = 0;
      let overdueTasksCount = 0;
      const groupAttendanceRates: number[] = [];
      const leaderUserIds = new Set<string>();

      supervisedGroups.forEach((group) => {
        totalMembers += group.memberships.length;

        group.memberships.forEach((membership) => {
          if (hasPastoralAttention(membership.person.riskScore)) {
            atRiskCount++;
          }
        });

        let groupAttendances = 0;
        let groupPossible = 0;
        group.events.forEach((event) => {
          groupAttendances += event.attendances.filter((attendance) => attendance.present).length;
          groupPossible += event.attendances.length;
        });

        if (groupPossible > 0) {
          groupAttendanceRates.push(Math.round((groupAttendances / groupPossible) * 100));
        }

        if (group.leaderUserId) {
          leaderUserIds.add(group.leaderUserId);
        }
      });

      overdueTasks.forEach((task) => {
        if (leaderUserIds.has(task.assigneeId)) {
          overdueTasksCount++;
        }
      });

      const averageAttendance =
        groupAttendanceRates.length > 0
          ? Math.round(
              groupAttendanceRates.reduce((sum, rate) => sum + rate, 0) /
                groupAttendanceRates.length,
            )
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
      details: "Lista de supervisores para leitura pastoral",
      ip: extractIp(request),
    });

    return NextResponse.json({ supervisors: result });
  } catch (error) {
    console.error("GET /api/pastor/supervisors failed", error);
    return serverErrorResponse();
  }
}
