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

    const { id: personId } = await params;

    // Busca a pessoa com church scoping
    const person = await prisma.person.findFirst({
      where: {
        id: personId,
        churchId: user.churchId,
        deletedAt: null,
      },
      include: {
        riskScore: true,
        memberships: {
          where: { leftAt: null, group: { deletedAt: null } },
          include: {
            group: { select: { id: true, name: true } },
          },
        },
        interactionsAsSubject: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            author: { select: { name: true } },
          },
        },
        attendances: {
          where: { event: { deletedAt: null, group: { deletedAt: null } } },
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
        },
      },
    });

    if (!person) {
      return domainErrorResponse("PERSON_NOT_FOUND");
    }

    await writeAuditLog({
      userId: user.userId,
      churchId: user.churchId,
      action: "read",
      resource: "person",
      resourceId: personId,
      details: "Perfil compartilhado do membro",
      ip: extractIp(request),
    });

    return NextResponse.json({
      person: {
        id: person.id,
        name: person.name,
        phone: person.phone,
        photoUrl: person.photoUrl,
        birthDate: person.birthDate,
        riskLevel: person.riskScore?.level ?? null,
        riskScore: person.riskScore?.score ?? null,
        groupName: person.memberships[0]?.group.name ?? null,
        groupId: person.memberships[0]?.group.id ?? null,
        interactions: person.interactionsAsSubject.map((i) => ({
          id: i.id,
          kind: i.kind,
          content: i.content,
          createdAt: i.createdAt,
          authorName: i.author.name,
        })),
        attendances: person.attendances.map((a) => ({
          present: a.present,
          eventDate: a.event.scheduledAt,
          eventTypeName: a.event.eventType.name,
          groupName: a.event.group.name,
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/members/[id] failed", error);
    return serverErrorResponse();
  }
}
