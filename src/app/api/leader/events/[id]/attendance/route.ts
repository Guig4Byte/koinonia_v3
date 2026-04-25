import { NextResponse } from "next/server";
import { domainErrorResponse, serverErrorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/get-current-user";
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

    if (
      user.role !== "leader" &&
      user.role !== "pastor" &&
      user.role !== "supervisor"
    ) {
      return domainErrorResponse("UNAUTHORIZED");
    }

    const { id: eventId } = await params;

    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      include: { group: true },
    });

    if (!event) {
      return domainErrorResponse("EVENT_NOT_FOUND");
    }

    // Valida que o evento pertence ao grupo do líder
    const group = await prisma.group.findFirst({
      where: {
        id: event.groupId,
        churchId: user.churchId,
        deletedAt: null,
        ...(user.role === "leader" ? { leaderId: user.userId } : {}),
      },
    });

    if (!group) {
      return domainErrorResponse("UNAUTHORIZED");
    }

    const memberships = await prisma.membership.findMany({
      where: { groupId: group.id, leftAt: null },
      include: {
        person: {
          include: {
            riskScore: true,
            attendances: {
              where: { eventId },
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
      riskLevel: m.person.riskScore?.level ?? null,
      present:
        m.person.attendances.length > 0
          ? (m.person.attendances[0]?.present ?? null)
          : null,
    }));

    await writeAuditLog({
      userId: user.userId,
      churchId: user.churchId,
      action: "read",
      resource: "attendance",
      resourceId: eventId,
      details: "Visualização de presença do evento",
      ip: extractIp(request),
    });

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.group.name,
        scheduledAt: event.scheduledAt,
        occurredAt: event.occurredAt,
      },
      members,
    });
  } catch (error) {
    console.error("GET /api/leader/events/[id]/attendance failed", error);
    return serverErrorResponse();
  }
}
