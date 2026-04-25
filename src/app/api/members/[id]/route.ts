import { NextResponse } from "next/server";
import { domainErrorResponse, serverErrorResponse } from "@/lib/api-response";
import { getCurrentUser, type CurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import { writeAuditLog, extractIp } from "@/app/api/_helpers/audit-log";

type ActiveMembershipContext = {
  group: {
    id: string;
    name: string;
    leaderId: string | null;
    supervisorId: string | null;
  };
};

type MemberProfileScope = "full" | "self";

function resolveMemberProfileScope(
  user: CurrentUser,
  personId: string,
  memberships: ActiveMembershipContext[],
): MemberProfileScope | null {
  if (user.role === "pastor") {
    return "full";
  }

  if (
    user.role === "supervisor" &&
    memberships.some((membership) => membership.group.supervisorId === user.userId)
  ) {
    return "full";
  }

  if (
    user.role === "leader" &&
    memberships.some((membership) => membership.group.leaderId === user.userId)
  ) {
    return "full";
  }

  if (user.personId === personId) {
    return "self";
  }

  return null;
}

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
                leaderId: true,
                supervisorId: true,
              },
            },
          },
        },
      },
    });

    if (!personAccess) {
      return domainErrorResponse("PERSON_NOT_FOUND");
    }

    const scope = resolveMemberProfileScope(user, personId, personAccess.memberships);

    if (!scope) {
      return domainErrorResponse("FORBIDDEN");
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
