import { NextResponse } from "next/server";
import {
  domainErrorResponse,
  serverErrorResponse,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/get-current-user";
import { EventPrismaRepository } from "@/app/api/_repositories/event.prisma-repository";
import { requireEventAccess } from "@/app/api/_helpers/require-event-access";
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

    const { id } = await params;

    const access = await requireEventAccess(user, id);
    if (!access.ok) {
      return access.response;
    }

    const eventRepository = new EventPrismaRepository();
    const event = await eventRepository.findById(id);

    if (!event) {
      return domainErrorResponse("EVENT_NOT_FOUND");
    }

    writeAuditLog({
      userId: user.userId,
      action: "read",
      resource: "event",
      resourceId: id,
      details: "Visualização de evento",
      ip: extractIp(request),
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error("GET /api/events/[id] failed", error);
    return serverErrorResponse();
  }
}
