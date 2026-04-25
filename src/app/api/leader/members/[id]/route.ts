import { NextResponse } from "next/server";
import { domainErrorResponse, serverErrorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import { writeAuditLog, extractIp } from "@/app/api/_helpers/audit-log";
import { canAccessApiRoute } from "@/lib/api-authorization";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getCurrentUser(request);

    if (!user) {
      return domainErrorResponse("UNAUTHORIZED");
    }

    if (!canAccessApiRoute(user, "leader:members")) {
      return domainErrorResponse("FORBIDDEN");
    }

    const { id: personId } = await params;

    const group = await prisma.group.findFirst({
      where: {
        churchId: user.churchId,
        deletedAt: null,
        leaderUserId: user.userId,
      },
      orderBy: { name: "asc" },
    });

    if (!group) {
      return domainErrorResponse("GROUP_NOT_FOUND");
    }

    const membership = await prisma.membership.findFirst({
      where: {
        personId,
        groupId: group.id,
        leftAt: null,
        person: { deletedAt: null },
      },
    });

    if (!membership) {
      return domainErrorResponse("FORBIDDEN");
    }

    const person = await prisma.person.findFirst({
      where: { id: personId, churchId: user.churchId, deletedAt: null },
      include: {
        riskScore: true,
        tags: { include: { tag: true } },
      },
    });

    if (!person) {
      return domainErrorResponse("PERSON_NOT_FOUND");
    }

    const events = await prisma.event.findMany({
      where: { groupId: group.id, deletedAt: null },
      orderBy: { scheduledAt: "desc" },
      take: 6,
      include: {
        eventType: true,
        attendances: {
          where: { personId, person: { deletedAt: null } },
        },
      },
    });

    const attendanceTimeline = events
      .map((event) => ({
        eventId: event.id,
        eventName: event.eventType.name,
        scheduledAt: event.scheduledAt,
        present:
          event.attendances.length > 0
            ? (event.attendances[0]?.present ?? null)
            : null,
      }))
      .reverse();

    const interactions = await prisma.interaction.findMany({
      where: { personId, person: { deletedAt: null } },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true } },
      },
    });

    await writeAuditLog({
      userId: user.userId,
      churchId: user.churchId,
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
