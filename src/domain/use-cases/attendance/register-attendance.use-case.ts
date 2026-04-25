import { err, ok, type Result } from "neverthrow";
import type { AttendanceRepository } from "@/domain/repositories/attendance.repository";
import type { EventRepository } from "@/domain/repositories/event.repository";
import type { PersonRepository } from "@/domain/repositories/person.repository";
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
  personRepository: PersonRepository,
  input: {
    eventId: string;
    attendances: ReadonlyArray<{ personId: string; present: boolean }>;
  },
): Promise<
  Result<
    AttendanceSummary,
    typeof DomainErrors.EVENT_NOT_FOUND | typeof DomainErrors.INVALID_ATTENDEES
  >
> {
  const event = await eventRepository.findById(input.eventId);

  if (!event) {
    return err(DomainErrors.EVENT_NOT_FOUND);
  }

  const personIds = input.attendances.map((a) => a.personId);
  const uniquePersonIds = new Set(personIds);

  if (uniquePersonIds.size !== personIds.length) {
    return err(DomainErrors.INVALID_ATTENDEES);
  }

  const groupMembers = await personRepository.findByGroup(event.groupId);
  const memberIds = new Set(groupMembers.map((m) => m.id));

  const invalidPersonIds = personIds.filter(
    (personId) => !memberIds.has(personId),
  );

  if (invalidPersonIds.length > 0) {
    return err(DomainErrors.INVALID_ATTENDEES);
  }

  const now = new Date();
  const occurredAt =
    event.occurredAt ?? (event.scheduledAt <= now ? event.scheduledAt : now);

  await attendanceRepository.registerForEvent({
    eventId: input.eventId,
    occurredAt,
    attendances: input.attendances,
  });

  const present = input.attendances.filter((a) => a.present).length;
  const absent = input.attendances.length - present;

  return ok({
    eventId: input.eventId,
    total: input.attendances.length,
    present,
    absent,
  });
}
