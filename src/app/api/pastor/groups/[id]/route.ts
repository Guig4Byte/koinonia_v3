import { NextResponse } from "next/server";
import { writeAuditLog, extractIp } from "@/app/api/_helpers/audit-log";
import { domainErrorResponse, serverErrorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/role-guard";

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

    const { id: groupId } = await params;
    const now = new Date();

    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        churchId: user.churchId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        leaderUserId: true,
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
            eventType: { select: { name: true } },
          },
        },
      },
    });

    if (!group) {
      return domainErrorResponse("GROUP_NOT_FOUND");
    }

    const leader = group.leaderUserId
      ? await prisma.user.findFirst({
          where: {
            id: group.leaderUserId,
            deletedAt: null,
            person: { deletedAt: null },
          },
          select: { id: true, person: { select: { name: true } } },
        })
      : null;

    const leaderTasks = await prisma.task.findMany({
      where: {
        groupId: group.id,
        assigneeId: group.leaderUserId ?? "",
        completedAt: null,
        deletedAt: null,
        dueAt: { lt: now },
      },
      orderBy: { dueAt: "asc" },
      select: {
        id: true,
        description: true,
        dueAt: true,
        completedAt: true,
      },
    });

    const memberIds = group.memberships.map((membership) => membership.person.id);
    const memberTasks = await prisma.task.findMany({
      where: {
        targetType: "person",
        targetId: { in: memberIds },
        completedAt: null,
        deletedAt: null,
      },
      select: {
        targetId: true,
        dueAt: true,
      },
    });
    const memberTasksByPersonId = new Map<string, typeof memberTasks>();
    memberTasks.forEach((task) => {
      const tasks = memberTasksByPersonId.get(task.targetId) ?? [];
      tasks.push(task);
      memberTasksByPersonId.set(task.targetId, tasks);
    });

    const members = group.memberships.map((membership) => {
      const lastContact = membership.person.interactionsAsSubject[0]?.createdAt;
      const daysSinceContact = lastContact
        ? Math.floor(
            (now.getTime() - new Date(lastContact).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null;
      const openTasks = memberTasksByPersonId.get(membership.person.id) ?? [];

      return {
        id: membership.person.id,
        name: membership.person.name,
        photoUrl: membership.person.photoUrl,
        riskLevel: membership.person.riskScore?.level ?? null,
        riskReasons: membership.person.riskScore?.reasons ?? [],
        lastInteractionDays: daysSinceContact,
        openTasksCount: openTasks.length,
        overdueTasksCount: openTasks.filter((task) => task.dueAt < now).length,
      };
    });

    const pastEvents = group.events.filter(
      (event) => event.occurredAt && new Date(event.occurredAt) < now,
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
      details: `Detalhe pastoral da célula: ${group.name}`,
      ip: extractIp(request),
    });

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        leaderName: leader?.person?.name ?? null,
        leaderUserId: group.leaderUserId,
        memberCount: members.length,
        hasUnregisteredAttendance,
      },
      members,
      events: group.events.map((event) => ({
        id: event.id,
        scheduledAt: event.scheduledAt,
        occurredAt: event.occurredAt,
        eventTypeName: event.eventType.name,
        attendanceCount: event.attendances.filter((attendance) => attendance.present).length,
        totalAttendances: event.attendances.length,
      })),
      leaderTasks: leaderTasks.map((task) => ({
        id: task.id,
        description: task.description,
        dueAt: task.dueAt,
        isOverdue: task.dueAt < now,
      })),
    });
  } catch (error) {
    console.error("GET /api/pastor/groups/[id] failed", error);
    return serverErrorResponse();
  }
}
