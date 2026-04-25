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

    const roleCheck = requireRole(user.role, ["supervisor"]);
    if (!roleCheck.authorized) {
      return domainErrorResponse(roleCheck.error);
    }

    const now = new Date();

    const groups = await prisma.group.findMany({
      where: {
        churchId: user.churchId,
        supervisorId: user.userId,
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
      where: { id: { in: leaderIds }, deletedAt: null, person: { deletedAt: null } },
      select: { id: true, person: { select: { name: true } } },
    });

    const leaderNameMap = new Map<string, string>();
    leaders.forEach((l) => {
      if (l.person?.name) leaderNameMap.set(l.id, l.person.name);
    });

    const result = groups.map((group) => {
      const memberCount = group.memberships.length;
      const atRiskCount = group.memberships.filter(
        (m) =>
          m.person.riskScore?.level === "red" ||
          m.person.riskScore?.level === "yellow",
      ).length;

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

      const lastAttendanceRate =
        pastEvents.length > 0 && pastEvents[0]!.attendances.length > 0
          ? Math.round(
              (pastEvents[0]!.attendances.filter((a) => a.present).length /
                pastEvents[0]!.attendances.length) *
                100,
            )
          : null;

      const hasUnregisteredAttendance =
        pastEvents.length > 0 &&
        pastEvents[0]!.attendances.length === 0 &&
        pastEvents[0]!.occurredAt &&
        new Date(pastEvents[0]!.occurredAt) < now;

      return {
        id: group.id,
        name: group.name,
        memberCount,
        atRiskCount,
        averageAttendance: avgAttendance,
        lastAttendanceRate,
        hasUnregisteredAttendance,
        leaderName: group.leaderId
          ? (leaderNameMap.get(group.leaderId) ?? null)
          : null,
      };
    });

    await writeAuditLog({
      userId: user.userId,
      churchId: user.churchId,
      action: "read",
      resource: "group",
      resourceId: user.churchId,
      details: "Lista de células do supervisor",
      ip: extractIp(request),
    });

    return NextResponse.json({ groups: result });
  } catch (error) {
    console.error("GET /api/supervisor/groups failed", error);
    return serverErrorResponse();
  }
}
