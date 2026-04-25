import type { Attendance } from '../entities/attendance.entity'

export interface AttendanceRegistration {
  readonly personId: string
  readonly present: boolean
}

export interface AttendanceRepository {
  findByEvent(eventId: string): Promise<readonly Attendance[]>
  findByPerson(personId: string, limit?: number): Promise<readonly Attendance[]>
  registerForEvent(input: {
    readonly eventId: string
    readonly occurredAt: Date
    readonly attendances: ReadonlyArray<AttendanceRegistration>
  }): Promise<void>
}
