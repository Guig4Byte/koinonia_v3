import { NextResponse } from "next/server";
import { domainErrorResponse, serverErrorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import { writeAuditLog, extractIp } from "@/app/api/_helpers/audit-log";

export async function GET(request: Request) {
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

    const group = await prisma.group.findFirst({
      where: {
        churchId: user.churchId,
        deletedAt: null,
        ...(user.role === "leader" ? { leaderId: user.userId } : {}),
      },
      orderBy: { name: "asc" },
    });

    if (!group) {
      return domainErrorResponse("GROUP_NOT_FOUND");
    }

    const memberships = await prisma.membership.findMany({
      where: { groupId: group.id, leftAt: null, person: { deletedAt: null } },
      include: {
        person: {
          include: {
            riskScore: true,
            interactionsAsSubject: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
            tags: {
              include: { tag: true },
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
      role: m.role,
      riskLevel: m.person.riskScore?.level ?? null,
      riskScore: m.person.riskScore?.score ?? null,
      lastInteraction: m.person.interactionsAsSubject[0]?.content ?? null,
      lastInteractionAt: m.person.interactionsAsSubject[0]?.createdAt ?? null,
      tags: m.person.tags.map((t) => t.tag.name),
    }));

    await writeAuditLog({
      userId: user.userId,
      churchId: user.churchId,
      action: "read",
      resource: "person",
      resourceId: group.id,
      details: "Listagem de membros do líder",
      ip: extractIp(request),
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error("GET /api/leader/members failed", error);
    return serverErrorResponse();
  }
}
