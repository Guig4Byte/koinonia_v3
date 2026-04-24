import { err, ok, type Result } from "neverthrow";
import type { AttendanceRepository } from "@/domain/repositories/attendance.repository";
import type { EventRepository } from "@/domain/repositories/event.repository";
import type { GroupRepository } from "@/domain/repositories/group.repository";
import type { PersonRepository } from "@/domain/repositories/person.repository";
import { DomainErrors } from "@/domain/errors/domain-errors";

export interface GroupHealth {
  groupId: string;
  groupName: string;
  totalMembers: number;
  recentEventsCount: number;
  averageAttendancePercentage: number;
}

export async function getGroupHealthUseCase(
  groupRepository: GroupRepository,
  personRepository: PersonRepository,
  eventRepository: EventRepository,
  attendanceRepository: AttendanceRepository,
  groupId: string,
): Promise<Result<GroupHealth, typeof DomainErrors.GROUP_NOT_FOUND>> {
  const group = await groupRepository.findById(groupId);

  if (!group) {
    return err(DomainErrors.GROUP_NOT_FOUND);
  }

  const members = await personRepository.findByGroup(groupId);
  const events = await eventRepository.findByGroup(groupId);

  // Últimos 6 eventos para cálculo de presença
  const recentEvents = events.slice(0, 6);

  let totalAttendances = 0;
  let totalPossible = 0;

  for (const event of recentEvents) {
    const attendances = await attendanceRepository.findByEvent(event.id);
    totalAttendances += attendances.filter((a) => a.present).length;
    totalPossible += attendances.length;
  }

  const averageAttendancePercentage =
    totalPossible > 0
      ? Math.round((totalAttendances / totalPossible) * 100)
      : 0;

  return ok({
    groupId: group.id,
    groupName: group.name,
    totalMembers: members.length,
    recentEventsCount: recentEvents.length,
    averageAttendancePercentage,
  });
}
