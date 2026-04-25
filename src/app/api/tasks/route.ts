import { NextResponse } from "next/server";
import {
  domainErrorResponse,
  invalidJsonResponse,
  serverErrorResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/get-current-user";
import { requireRole } from "@/lib/role-guard";
import prisma from "@/lib/prisma";
import { writeAuditLog, extractIp } from "@/app/api/_helpers/audit-log";
import { z } from "zod";

const createTaskSchema = z.object({
  assigneeId: z.string().min(1),
  groupId: z.string().min(1),
  description: z.string().min(1).max(500),
  dueAt: z.string().datetime(),
  targetType: z.enum(["person", "group", "leader"]),
  targetId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = getCurrentUser(request);

    if (!user) {
      return domainErrorResponse("UNAUTHORIZED");
    }

    const roleCheck = requireRole(user.role, ["pastor", "supervisor"]);
    if (!roleCheck.authorized) {
      return domainErrorResponse(roleCheck.error);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return invalidJsonResponse();
    }

    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { assigneeId, groupId, description, dueAt, targetType, targetId } =
      parsed.data;

    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        churchId: user.churchId,
        deletedAt: null,
      },
      select: {
        id: true,
        leaderId: true,
        supervisorId: true,
      },
    });

    if (!group) {
      return domainErrorResponse("GROUP_NOT_FOUND");
    }

    if (user.role === "supervisor" && group.supervisorId !== user.userId) {
      return domainErrorResponse("UNAUTHORIZED");
    }

    const assignee = await prisma.user.findFirst({
      where: {
        id: assigneeId,
        churchId: user.churchId,
        deletedAt: null,
        person: { deletedAt: null },
      },
      select: { id: true },
    });

    if (!assignee) {
      return domainErrorResponse("USER_NOT_FOUND");
    }

    const allowedAssigneeIds = [group.leaderId, group.supervisorId].filter(
      (id): id is string => Boolean(id),
    );

    if (!allowedAssigneeIds.includes(assigneeId)) {
      return domainErrorResponse("INVALID_TASK_TARGET");
    }

    if (targetType === "person") {
      const personMembership = await prisma.membership.findFirst({
        where: {
          groupId: group.id,
          personId: targetId,
          leftAt: null,
          person: {
            churchId: user.churchId,
            deletedAt: null,
          },
          group: {
            churchId: user.churchId,
            deletedAt: null,
          },
        },
        select: { id: true },
      });

      if (!personMembership) {
        return domainErrorResponse("INVALID_TASK_TARGET");
      }
    } else if (targetType === "group") {
      if (targetId !== group.id) {
        return domainErrorResponse("INVALID_TASK_TARGET");
      }
    } else if (targetType === "leader") {
      if (!group.leaderId || targetId !== group.leaderId) {
        return domainErrorResponse("INVALID_TASK_TARGET");
      }

      const leader = await prisma.user.findFirst({
        where: {
          id: targetId,
          churchId: user.churchId,
          role: "leader",
          deletedAt: null,
          person: { deletedAt: null },
        },
        select: { id: true },
      });

      if (!leader) {
        return domainErrorResponse("INVALID_TASK_TARGET");
      }
    }

    const task = await prisma.$transaction(async (tx) => {
      const createdTask = await tx.task.create({
        data: {
          assigneeId,
          groupId,
          description,
          dueAt: new Date(dueAt),
          targetType,
          targetId,
        },
      });

      await writeAuditLog(
        {
          userId: user.userId,
          churchId: user.churchId,
          action: "create",
          resource: "task",
          resourceId: createdTask.id,
          details: `Task criada: ${description}`,
          ip: extractIp(request),
        },
        tx,
      );

      return createdTask;
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks failed", error);
    return serverErrorResponse();
  }
}
