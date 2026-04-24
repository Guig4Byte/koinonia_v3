import { err, ok, type Result } from "neverthrow";
import type { AttendanceRepository } from "@/domain/repositories/attendance.repository";
import type { EventRepository } from "@/domain/repositories/event.repository";
import { DomainErrors } from "@/domain/errors/domain-errors";

export interface AttendanceSummary {
  eventId: string;
  total: number;
  present: number;
  absent: number;
}

export async function registerAttendanceUseCase(
  eventRepository: EventRepository,
  attendanceRepository: AttendanceRepository,
  input: {
    eventId: string;
    attendances: ReadonlyArray<{ personId: string; present: boolean }>;
  },
): Promise<Result<AttendanceSummary, typeof DomainErrors.EVENT_NOT_FOUND>> {
  const event = await eventRepository.findById(input.eventId);

  if (!event) {
    return err(DomainErrors.EVENT_NOT_FOUND);
  }

  await attendanceRepository.upsertMany(
    input.attendances.map((a) => ({
      eventId: input.eventId,
      personId: a.personId,
      present: a.present,
    })),
  );

  const present = input.attendances.filter((a) => a.present).length;
  const absent = input.attendances.length - present;

  return ok({
    eventId: input.eventId,
    total: input.attendances.length,
    present,
    absent,
  });
}
