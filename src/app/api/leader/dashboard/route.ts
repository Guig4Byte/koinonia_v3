import { NextResponse } from "next/server";
import { domainErrorResponse, serverErrorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import { writeAuditLog, extractIp } from "@/app/api/_helpers/audit-log";
import { canAccessApiRoute } from "@/lib/api-authorization";

export async function GET(request: Request) {
  try {
    const user = getCurrentUser(request);

    if (!user) {
      return domainErrorResponse("UNAUTHORIZED");
    }

    if (!canAccessApiRoute(user, "leader:dashboard")) {
      return domainErrorResponse("FORBIDDEN");
    }

    const group = await prisma.group.findFirst({
      where: {
        churchId: user.churchId,
        deletedAt: null,
        leaderUserId: user.userId,
      },
      orderBy: { name: "asc" },
    });

    if (!group) {
      return domainErrorResponse("GROUP_NOT_FOUND");
    }

    const memberships = await prisma.membership.findMany({
      where: { groupId: group.id, leftAt: null, person: { deletedAt: null } },
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
      orderBy: { person: { name: "asc" } },
    });

    const members = memberships.map((m) => ({
      id: m.person.id,
      name: m.person.name,
      photoUrl: m.person.photoUrl,
      role: m.role,
      riskLevel: m.person.riskScore?.level ?? null,
      riskScore: m.person.riskScore?.score ?? null,
      lastInteraction: m.person.interactionsAsSubject[0]?.content ?? null,
      lastInteractionAt: m.person.interactionsAsSubject[0]?.createdAt ?? null,
    }));

    const latestEvent = await prisma.event.findFirst({
      where: { groupId: group.id, deletedAt: null },
      orderBy: { scheduledAt: "desc" },
      include: {
        attendances: {
          where: { person: { deletedAt: null } },
        },
      },
    });

    const lastAttendanceRate = latestEvent
      ? latestEvent.attendances.length > 0
        ? Math.round(
            (latestEvent.attendances.filter((a) => a.present).length /
              latestEvent.attendances.length) *
              100,
          )
        : 0
      : 0;

    const atRiskCount = members.filter(
      (m) => m.riskLevel === "red" || m.riskLevel === "yellow",
    ).length;

    await writeAuditLog({
      userId: user.userId,
      churchId: user.churchId,
      action: "read",
      resource: "group",
      resourceId: group.id,
      details: "Dashboard do líder",
      ip: extractIp(request),
    });

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
      },
      summary: {
        totalMembers: members.length,
        lastAttendanceRate,
        atRiskCount,
      },
      members,
    });
  } catch (error) {
    console.error("GET /api/leader/dashboard failed", error);
    return serverErrorResponse();
  }
}
