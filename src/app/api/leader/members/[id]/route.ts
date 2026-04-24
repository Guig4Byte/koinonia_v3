import { NextResponse } from "next/server";
import {
  domainErrorResponse,
  serverErrorResponse,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import { writeAuditLog, extractIp } from "@/app/api/_helpers/audit-log";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUser(request);

    if (!user) {
      return domainErrorResponse("UNAUTHORIZED");
    }

    if (user.role !== "leader" && user.role !== "pastor" && user.role !== "supervisor") {
      return domainErrorResponse("UNAUTHORIZED");
    }

    const { id: personId } = await params;

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

    // Valida que o membro pertence ao grupo do líder
    const membership = await prisma.membership.findFirst({
      where: { personId, groupId: group.id, leftAt: null },
    });

    if (!membership) {
      return domainErrorResponse("UNAUTHORIZED");
    }

    const person = await prisma.person.findUnique({
      where: { id: personId },
      include: {
        riskScore: true,
        tags: { include: { tag: true } },
      },
    });

    if (!person) {
      return domainErrorResponse("PERSON_NOT_FOUND");
    }

    // Últimos 6 eventos do grupo com presença do membro
    const events = await prisma.event.findMany({
      where: { groupId: group.id, deletedAt: null },
      orderBy: { scheduledAt: "desc" },
      take: 6,
      include: {
        eventType: true,
        attendances: {
          where: { personId },
        },
      },
    });

    const attendanceTimeline = events.map((event) => ({
      eventId: event.id,
      eventName: event.eventType.name,
      scheduledAt: event.scheduledAt,
      present: event.attendances.length > 0 ? event.attendances[0]?.present ?? null : null,
    })).reverse();

    // Interações cronológicas
    const interactions = await prisma.interaction.findMany({
      where: { personId },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true } },
      },
    });

    writeAuditLog({
      userId: user.userId,
      action: "read",
      resource: "person",
      resourceId: personId,
      details: "Visualização de perfil do membro",
      ip: extractIp(request),
    });

    return NextResponse.json({
      member: {
        id: person.id,
        name: person.name,
        photoUrl: person.photoUrl,
        phone: person.phone,
        riskLevel: person.riskScore?.level ?? null,
        riskScore: person.riskScore?.score ?? null,
        riskReasons: person.riskScore?.reasons ?? [],
        tags: person.tags.map((t) => t.tag.name),
      },
      attendanceTimeline,
      interactions: interactions.map((i) => ({
        id: i.id,
        kind: i.kind,
        content: i.content,
        authorName: i.author.name,
        createdAt: i.createdAt,
      })),
    });
  } catch (error) {
    console.error("GET /api/leader/members/[id] failed", error);
    return serverErrorResponse();
  }
}
