import { NextResponse } from "next/server";
import {
  domainErrorResponse,
  serverErrorResponse,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import { writeAuditLog, extractIp } from "@/app/api/_helpers/audit-log";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUser(request);

    if (!user) {
      return domainErrorResponse("UNAUTHORIZED");
    }

    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return domainErrorResponse("TASK_NOT_FOUND");
    }

    if (task.assigneeId !== user.userId && user.role !== "pastor") {
      return domainErrorResponse("UNAUTHORIZED");
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        completedAt: task.completedAt ? null : new Date(),
      },
    });

    writeAuditLog({
      userId: user.userId,
      action: "update",
      resource: "task",
      resourceId: id,
      details: task.completedAt ? "Task reaberta" : "Task concluída",
      ip: extractIp(request),
    });

    return NextResponse.json({ task: updated });
  } catch (error) {
    console.error("PATCH /api/tasks/[id] failed", error);
    return serverErrorResponse();
  }
}
