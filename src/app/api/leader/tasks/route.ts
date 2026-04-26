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

    if (!canAccessApiRoute(user, "leader:tasks")) {
      return domainErrorResponse("FORBIDDEN");
    }

    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: user.userId,
        deletedAt: null,
        group: {
          churchId: user.churchId,
          deletedAt: null,
          leaderUserId: user.userId,
        },
      },
      orderBy: [
        { completedAt: { sort: "asc", nulls: "first" } },
        { dueAt: "asc" },
      ],
      include: {
        group: { select: { name: true } },
        need: {
          include: {
            person: { select: { id: true, name: true } },
          },
        },
      },
    });

    const personTargetIds = tasks
      .filter((task) => task.targetType === "person")
      .map((task) => task.targetId);

    const targetPeople = personTargetIds.length > 0
      ? await prisma.person.findMany({
          where: {
            id: { in: personTargetIds },
            churchId: user.churchId,
            deletedAt: null,
          },
          select: { id: true, name: true },
        })
      : [];

    const targetPeopleById = new Map(
      targetPeople.map((person) => [person.id, person]),
    );

    await writeAuditLog({
      userId: user.userId,
      churchId: user.churchId,
      action: "read",
      resource: "task",
      resourceId: user.userId,
      details: "Listagem de tasks do líder",
      ip: extractIp(request),
    });

    return NextResponse.json({
      tasks: tasks.map((task) => {
        const targetPerson = task.targetType === "person"
          ? targetPeopleById.get(task.targetId)
          : null;

        return {
          id: task.id,
          description: task.description,
          dueAt: task.dueAt,
          completedAt: task.completedAt,
          targetType: task.targetType,
          targetId: task.targetId,
          groupName: task.group?.name ?? null,
          personName: targetPerson?.name ?? task.need?.person.name ?? null,
          personId: targetPerson?.id ?? task.need?.person.id ?? null,
        };
      }),
    });
  } catch (error) {
    console.error("GET /api/leader/tasks failed", error);
    return serverErrorResponse();
  }
}
