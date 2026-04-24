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
import { registerAttendanceUseCase } from "@/domain/use-cases/attendance/register-attendance.use-case";
import { registerAttendanceSchema } from "@/lib/validations/events/event-id";
import { requireEventAccess } from "@/app/api/_helpers/require-event-access";
import { writeAuditLog, extractIp } from "@/app/api/_helpers/audit-log";

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

    const eventRepository = new EventPrismaRepository();
    const attendanceRepository = new AttendancePrismaRepository();

    const result = await registerAttendanceUseCase(
      eventRepository,
      attendanceRepository,
      {
        eventId,
        attendances: parsedBody.data.attendances,
      },
    );

    if (result.isErr()) {
      return domainErrorResponse(result.error);
    }

    writeAuditLog({
      userId: user.userId,
      action: "create",
      resource: "attendance",
      resourceId: eventId,
      details: `Registro de presença: ${result.value.present} presentes, ${result.value.absent} faltas`,
      ip: extractIp(request),
    });

    return NextResponse.json({ summary: result.value });
  } catch (error) {
    console.error("POST /api/events/[id]/attendance failed", error);
    return serverErrorResponse();
  }
}
