import { NextResponse } from "next/server";
import { domainErrorResponse, serverErrorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/get-current-user";
import { requireRole } from "@/lib/role-guard";
import prisma from "@/lib/prisma";
import { writeAuditLog, extractIp } from "@/app/api/_helpers/audit-log";

export async function GET(request: Request) {
  try {
    const user = getCurrentUser(request);

    if (!user) {
      return domainErrorResponse("UNAUTHORIZED");
    }

    const roleCheck = requireRole(user.role, ["pastor", "supervisor"]);
    if (!roleCheck.authorized) {
      return domainErrorResponse(roleCheck.error);
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({
        people: [],
        groups: [],
        events: [],
      });
    }

    // Busca pessoas por nome ou telefone
    const people = await prisma.person.findMany({
      where: {
        churchId: user.churchId,
        deletedAt: null,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        photoUrl: true,
        riskScore: { select: { level: true } },
        memberships: {
          where: { leftAt: null, group: { deletedAt: null } },
          select: {
            group: { select: { id: true, name: true } },
          },
        },
      },
      take: 10,
    });

    // Busca células por nome
    const groups = await prisma.group.findMany({
      where: {
        churchId: user.churchId,
        deletedAt: null,
        name: { contains: q, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        memberships: {
          where: { leftAt: null, person: { deletedAt: null } },
          select: { personId: true },
        },
      },
      take: 10,
    });

    // Busca eventos por tipo
    const events = await prisma.event.findMany({
      where: {
        group: { churchId: user.churchId, deletedAt: null },
        deletedAt: null,
        eventType: { name: { contains: q, mode: "insensitive" } },
      },
      select: {
        id: true,
        scheduledAt: true,
        occurredAt: true,
        group: { select: { id: true, name: true } },
        eventType: { select: { name: true } },
        attendances: {
          where: { person: { deletedAt: null } },
          select: { present: true },
        },
      },
      orderBy: { scheduledAt: "desc" },
      take: 10,
    });

    await writeAuditLog({
      userId: user.userId,
      churchId: user.churchId,
      action: "read",
      resource: "person",
      resourceId: "pastor-search",
      details: `Busca global por "${q}" (${people.length} pessoas, ${groups.length} células, ${events.length} eventos)`,
      ip: extractIp(request),
    });

    return NextResponse.json({
      people: people.map((p) => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        photoUrl: p.photoUrl,
        riskLevel: p.riskScore?.level ?? null,
        groupName: p.memberships[0]?.group.name ?? null,
        groupId: p.memberships[0]?.group.id ?? null,
      })),
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        memberCount: g.memberships.length,
      })),
      events: events.map((e) => ({
        id: e.id,
        scheduledAt: e.scheduledAt,
        occurredAt: e.occurredAt,
        groupName: e.group.name,
        groupId: e.group.id,
        eventTypeName: e.eventType.name,
        attendanceCount: e.attendances.filter((a) => a.present).length,
        totalAttendances: e.attendances.length,
      })),
    });
  } catch (error) {
    console.error("GET /api/pastor/search failed", error);
    return serverErrorResponse();
  }
}
