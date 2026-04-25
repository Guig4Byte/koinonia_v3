import { NextResponse } from "next/server";
import { domainErrorResponse, serverErrorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import { writeAuditLog, extractIp } from "@/app/api/_helpers/audit-log";
import {
  canAccessApiRoute,
  resolvePersonAccessScope,
} from "@/lib/api-authorization";

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
        groupName: personAccess.memberships[0]?.group.name ?? null,
        groupId: personAccess.memberships[0]?.group.id ?? null,
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
