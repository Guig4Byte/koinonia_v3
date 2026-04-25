import { NextResponse } from "next/server";
import { domainErrorResponse, serverErrorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/get-current-user";
import { requireRole } from "@/lib/role-guard";
import prisma from "@/lib/prisma";
import { writeAuditLog, extractIp } from "@/app/api/_helpers/audit-log";
import { buildDashboard } from "@/domain/use-cases/dashboard/build-dashboard.use-case";

export async function GET(request: Request) {
  try {
    const user = getCurrentUser(request);

    if (!user) {
      return domainErrorResponse("UNAUTHORIZED");
    }

    const roleCheck = requireRole(user.role, ["supervisor"]);
    if (!roleCheck.authorized) {
      return domainErrorResponse(roleCheck.error);
    }

    const groups = await prisma.group.findMany({
      where: {
        churchId: user.churchId,
        supervisorId: user.userId,
        deletedAt: null,
      },
      include: {
        memberships: {
          where: { leftAt: null, person: { deletedAt: null } },
          include: {
            person: {
              include: {
                riskScore: true,
                interactionsAsSubject: {
                  orderBy: { createdAt: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
        events: {
          where: { deletedAt: null },
          orderBy: { scheduledAt: "desc" },
          take: 6,
          include: {
            attendances: {
              where: { person: { deletedAt: null } },
            },
          },
        },
      },
    });

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

    const userNameMap = new Map<string, string>();
    leaders.forEach((l) => {
      if (l.person?.name) userNameMap.set(l.id, l.person.name);
    });

    const now = new Date();
    const overdueTasks = await prisma.task.findMany({
      where: {
        group: {
          churchId: user.churchId,
          supervisorId: user.userId,
          deletedAt: null,
        },
        assignee: { deletedAt: null, person: { deletedAt: null } },
        completedAt: null,
        dueAt: { lt: now },
        deletedAt: null,
      },
      include: {
        assignee: { select: { id: true, person: { select: { name: true } } } },
        group: { select: { id: true, name: true } },
      },
    });

    const dashboard = buildDashboard(groups, overdueTasks, userNameMap);

    await writeAuditLog({
      userId: user.userId,
      action: "read",
      resource: "group",
      resourceId: user.churchId,
      details: "Dashboard do supervisor",
      ip: extractIp(request),
    });

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error("GET /api/supervisor/dashboard failed", error);
    return serverErrorResponse();
  }
}
