import type { Attendance } from '../entities/attendance.entity'

export interface AttendanceRepository {
  findByEvent(eventId: string): Promise<readonly Attendance[]>
  findByPerson(personId: string, limit?: number): Promise<readonly Attendance[]>
  upsertMany(attendances: ReadonlyArray<Omit<Attendance, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void>
}
