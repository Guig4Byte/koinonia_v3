import { NextResponse } from "next/server";
import { domainErrorResponse, serverErrorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import { writeAuditLog, extractIp } from "@/app/api/_helpers/audit-log";
import {
  canAccessApiRoute,
  resolvePersonAccessScope,
} from "@/lib/api-authorization";

type TaskAssignee = {
  id: string;
  role: "pastor" | "supervisor" | "leader" | "host" | "member";
  person: { name: string };
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getCurrentUser(request);

    if (!user) {
      return domainErrorResponse("UNAUTHORIZED");
    }

    if (!canAccessApiRoute(user, "members:read")) {
      return domainErrorResponse("FORBIDDEN");
    }

    const { id: personId } = await params;

    const scope = await resolvePersonAccessScope(user, personId);

    if (!scope) {
      return domainErrorResponse("FORBIDDEN");
    }

    const personAccess = await prisma.person.findFirst({
      where: {
        id: personId,
        churchId: user.churchId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        photoUrl: true,
        birthDate: true,
        memberships: {
          where: {
            leftAt: null,
            group: { deletedAt: null },
          },
          select: {
            group: {
              select: {
                id: true,
                name: true,
                leader: {
                  select: {
                    id: true,
                    role: true,
                    person: { select: { name: true } },
                  },
                },
                supervisor: {
                  select: {
                    id: true,
                    role: true,
                    person: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!personAccess) {
      return domainErrorResponse("PERSON_NOT_FOUND");
    }

    const attendances = await prisma.attendance.findMany({
      where: {
        personId,
        event: { deletedAt: null, group: { deletedAt: null } },
      },
      orderBy: { event: { scheduledAt: "desc" } },
      take: 6,
      include: {
        event: {
          select: {
            scheduledAt: true,
            eventType: { select: { name: true } },
            group: { select: { name: true } },
          },
        },
      },
    });

    const sensitiveData =
      scope === "full"
        ? await prisma.person.findUnique({
            where: { id: personId },
            select: {
              riskScore: true,
              interactionsAsSubject: {
                orderBy: { createdAt: "desc" },
                take: 10,
                include: {
                  author: { select: { name: true } },
                },
              },
            },
          })
        : null;

    const groupIds = personAccess.memberships.map((membership) => membership.group.id);
    const currentGroup = personAccess.memberships[0]?.group ?? null;

    const tasks =
      scope === "full"
        ? await prisma.task.findMany({
            where: {
              targetType: "person",
              targetId: personId,
              deletedAt: null,
              ...(groupIds.length > 0 ? { groupId: { in: groupIds } } : {}),
              group: {
                churchId: user.churchId,
                deletedAt: null,
              },
            },
            orderBy: [
              { completedAt: { sort: "asc", nulls: "first" } },
              { dueAt: "asc" },
            ],
            take: 6,
            include: {
              assignee: {
                select: {
                  person: { select: { name: true } },
                },
              },
            },
          })
        : [];

    const rawAssignees = [currentGroup?.leader, currentGroup?.supervisor].filter(
      (assignee): assignee is TaskAssignee => Boolean(assignee),
    );

    const uniqueAssignees = rawAssignees.filter(
      (assignee, index, list) => list.findIndex((item) => item.id === assignee.id) === index,
    );

    const taskAssignees =
      scope === "full"
        ? uniqueAssignees.filter((assignee) => {
            if (user.role === "pastor") return true;
            if (user.role === "supervisor") return assignee.role === "leader" || assignee.id === user.userId;
            if (user.role === "leader") return assignee.id === user.userId;
            return false;
          })
        : [];

    await writeAuditLog({
      userId: user.userId,
      churchId: user.churchId,
      action: "read",
      resource: "person",
      resourceId: personId,
      details:
        scope === "full"
          ? "Perfil compartilhado do membro com dados pastorais"
          : "Perfil próprio do membro sem dados pastorais sensíveis",
      ip: extractIp(request),
    });

    return NextResponse.json({
      person: {
        id: personAccess.id,
        name: personAccess.name,
        phone: personAccess.phone,
        photoUrl: personAccess.photoUrl,
        birthDate: personAccess.birthDate,
        riskLevel: sensitiveData?.riskScore?.level ?? null,
        riskScore: sensitiveData?.riskScore?.score ?? null,
        groupName: currentGroup?.name ?? null,
        groupId: currentGroup?.id ?? null,
        taskAssignees: taskAssignees.map((assignee) => ({
          id: assignee.id,
          name: assignee.person.name,
          role: assignee.role,
        })),
        tasks: tasks.map((task) => ({
          id: task.id,
          description: task.description,
          dueAt: task.dueAt,
          completedAt: task.completedAt,
          assigneeName: task.assignee.person.name,
        })),
        interactions:
          sensitiveData?.interactionsAsSubject.map((interaction) => ({
            id: interaction.id,
            kind: interaction.kind,
            content: interaction.content,
            createdAt: interaction.createdAt,
            authorName: interaction.author.name,
          })) ?? [],
        attendances: attendances.map((attendance) => ({
          present: attendance.present,
          eventDate: attendance.event.scheduledAt,
          eventTypeName: attendance.event.eventType.name,
          groupName: attendance.event.group.name,
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/members/[id] failed", error);
    return serverErrorResponse();
  }
}
