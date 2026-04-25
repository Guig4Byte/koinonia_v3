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

    const roleCheck = requireRole(user.role, ["supervisor"]);
    if (!roleCheck.authorized) {
      return domainErrorResponse(roleCheck.error);
    }

    const { id: groupId } = await params;
    const now = new Date();

    // Verifica se o grupo pertence ao supervisor
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        churchId: user.churchId,
        supervisorId: user.userId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        leaderId: true,
        memberships: {
          where: { leftAt: null },
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
            attendances: true,
            eventType: { select: { name: true } },
          },
        },
      },
    });

    if (!group) {
      return domainErrorResponse("GROUP_NOT_FOUND");
    }

    // Busca líder
    const leader = group.leaderId
      ? await prisma.user.findFirst({
          where: { id: group.leaderId, deletedAt: null },
          select: { id: true, person: { select: { name: true } } },
        })
      : null;

    // Busca tasks pendentes do líder
    const leaderTasks = await prisma.task.findMany({
      where: {
        groupId: group.id,
        assigneeId: group.leaderId ?? "",
        completedAt: null,
        deletedAt: null,
      },
      orderBy: { dueAt: "asc" },
      select: {
        id: true,
        description: true,
        dueAt: true,
        completedAt: true,
      },
    });

    const members = group.memberships.map((m) => {
      const lastContact = m.person.interactionsAsSubject[0]?.createdAt;
      const daysSinceContact = lastContact
        ? Math.floor(
            (now.getTime() - new Date(lastContact).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null;

      return {
        id: m.person.id,
        name: m.person.name,
        photoUrl: m.person.photoUrl,
        riskLevel: m.person.riskScore?.level ?? null,
        lastInteractionDays: daysSinceContact,
      };
    });

    const pastEvents = group.events.filter(
      (e) => e.occurredAt && new Date(e.occurredAt) < now,
    );

    const hasUnregisteredAttendance =
      pastEvents.length > 0 &&
      pastEvents[0]!.attendances.length === 0 &&
      pastEvents[0]!.occurredAt &&
      new Date(pastEvents[0]!.occurredAt) < now;

    await writeAuditLog({
      userId: user.userId,
      churchId: user.churchId,
      action: "read",
      resource: "group",
      resourceId: groupId,
      details: `Detalhe da célula: ${group.name}`,
      ip: extractIp(request),
    });

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        leaderName: leader?.person?.name ?? null,
        leaderId: group.leaderId,
        memberCount: members.length,
        hasUnregisteredAttendance,
      },
      members,
      events: group.events.map((e) => ({
        id: e.id,
        scheduledAt: e.scheduledAt,
        occurredAt: e.occurredAt,
        eventTypeName: e.eventType.name,
        attendanceCount: e.attendances.filter((a) => a.present).length,
        totalAttendances: e.attendances.length,
      })),
      leaderTasks: leaderTasks.map((t) => ({
        id: t.id,
        description: t.description,
        dueAt: t.dueAt,
        isOverdue: t.dueAt < now,
      })),
    });
  } catch (error) {
    console.error("GET /api/supervisor/groups/[id] failed", error);
    return serverErrorResponse();
  }
}
