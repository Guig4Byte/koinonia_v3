import { NextResponse } from "next/server";
import {
  domainErrorResponse,
  serverErrorResponse,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/get-current-user";
import { requireRole } from "@/lib/role-guard";
import { GroupPrismaRepository } from "@/app/api/_repositories/group.prisma-repository";
import { PersonPrismaRepository } from "@/app/api/_repositories/person.prisma-repository";
import { EventPrismaRepository } from "@/app/api/_repositories/event.prisma-repository";
import { AttendancePrismaRepository } from "@/app/api/_repositories/attendance.prisma-repository";
import { getGroupHealthUseCase } from "@/domain/use-cases/dashboard/get-group-health.use-case";
import { requireGroupAccess } from "@/app/api/_helpers/require-group-access";
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

    const roleCheck = requireRole(user.role, [
      "pastor",
      "supervisor",
      "leader",
    ]);

    if (!roleCheck.authorized) {
      return domainErrorResponse(roleCheck.error);
    }

    const { id } = await params;

    const access = await requireGroupAccess(user, id);
    if (!access.ok) {
      return access.response;
    }

    const groupRepository = new GroupPrismaRepository();
    const personRepository = new PersonPrismaRepository();
    const eventRepository = new EventPrismaRepository();
    const attendanceRepository = new AttendancePrismaRepository();

    const result = await getGroupHealthUseCase(
      groupRepository,
      personRepository,
      eventRepository,
      attendanceRepository,
      id,
    );

    if (result.isErr()) {
      return domainErrorResponse(result.error);
    }

    writeAuditLog({
      userId: user.userId,
      action: "read",
      resource: "group",
      resourceId: id,
      details: "Visualização de saúde da célula",
      ip: extractIp(request),
    });

    return NextResponse.json({ health: result.value });
  } catch (error) {
    console.error("GET /api/groups/[id]/health failed", error);
    return serverErrorResponse();
  }
}
