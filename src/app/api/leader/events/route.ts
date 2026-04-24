import { NextResponse } from "next/server";
import {
  domainErrorResponse,
  serverErrorResponse,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import { writeAuditLog, extractIp } from "@/app/api/_helpers/audit-log";

export async function GET(request: Request) {
  try {
    const user = getCurrentUser(request);

    if (!user) {
      return domainErrorResponse("UNAUTHORIZED");
    }

    if (user.role !== "leader" && user.role !== "pastor" && user.role !== "supervisor") {
      return domainErrorResponse("UNAUTHORIZED");
    }

    const group = await prisma.group.findFirst({
      where: {
        churchId: user.churchId,
        ...(user.role === "leader" ? { leaderId: user.userId } : {}),
      },
      orderBy: { name: "asc" },
    });

    if (!group) {
      return domainErrorResponse("GROUP_NOT_FOUND");
    }

    const events = await prisma.event.findMany({
      where: { groupId: group.id, deletedAt: null },
      orderBy: { scheduledAt: "desc" },
      include: {
        eventType: true,
        attendances: {
          select: { present: true },
        },
      },
    });

    writeAuditLog({
      userId: user.userId,
      action: "read",
      resource: "event",
      resourceId: group.id,
      details: "Listagem de eventos do líder",
      ip: extractIp(request),
    });

    return NextResponse.json({
      events: events.map((event) => {
        const presentCount = event.attendances.filter((a) => a.present).length;
        return {
          id: event.id,
          name: event.eventType.name,
          kind: event.eventType.kind,
          scheduledAt: event.scheduledAt,
          occurredAt: event.occurredAt,
          attendanceCount: event.attendances.length,
          presentCount,
        };
      }),
    });
  } catch (error) {
    console.error("GET /api/leader/events failed", error);
    return serverErrorResponse();
  }
}
