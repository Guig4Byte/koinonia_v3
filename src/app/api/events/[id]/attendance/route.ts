import { NextResponse } from "next/server";
import {
  domainErrorResponse,
  invalidJsonResponse,
  serverErrorResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/get-current-user";
import { requireRole } from "@/lib/role-guard";
import { EventPrismaRepository } from "@/app/api/_repositories/event.prisma-repository";
import { AttendancePrismaRepository } from "@/app/api/_repositories/attendance.prisma-repository";
import { PersonPrismaRepository } from "@/app/api/_repositories/person.prisma-repository";
import { registerAttendanceUseCase } from "@/domain/use-cases/attendance/register-attendance.use-case";
import { registerAttendanceSchema } from "@/lib/validations/events/event-id";
import { requireEventAccess } from "@/app/api/_helpers/require-event-access";
import { writeAuditLog, extractIp } from "@/app/api/_helpers/audit-log";
import prisma from "@/lib/prisma";

export async function POST(
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

    const { id: eventId } = await params;

    const access = await requireEventAccess(user, eventId);
    if (!access.ok) {
      return access.response;
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return invalidJsonResponse();
    }

    const parsedBody = registerAttendanceSchema.safeParse(body);

    if (!parsedBody.success) {
      return validationErrorResponse(parsedBody.error);
    }

    const result = await prisma.$transaction(async (tx) => {
      const eventRepository = new EventPrismaRepository(tx);
      const attendanceRepository = new AttendancePrismaRepository(tx);
      const personRepository = new PersonPrismaRepository(tx);

      const attendanceResult = await registerAttendanceUseCase(
        eventRepository,
        attendanceRepository,
        personRepository,
        {
          eventId,
          attendances: parsedBody.data.attendances,
        },
      );

      if (attendanceResult.isErr()) {
        return attendanceResult;
      }

      await writeAuditLog(
        {
          userId: user.userId,
          churchId: user.churchId,
          action: "create",
          resource: "attendance",
          resourceId: eventId,
          details: `Registro de presença: ${attendanceResult.value.present} presentes, ${attendanceResult.value.absent} faltas`,
          ip: extractIp(request),
        },
        tx,
      );

      return attendanceResult;
    });

    if (result.isErr()) {
      return domainErrorResponse(result.error);
    }

    return NextResponse.json({ summary: result.value });
  } catch (error) {
    console.error("POST /api/events/[id]/attendance failed", error);
    return serverErrorResponse();
  }
}
