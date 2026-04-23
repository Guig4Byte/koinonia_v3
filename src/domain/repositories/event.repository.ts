import type { Event } from '../entities/event.entity'

export interface EventRepository {
  findById(id: string): Promise<Event | null>
  findByGroup(groupId: string): Promise<readonly Event[]>
  findByChurch(churchId: string): Promise<readonly Event[]>
  findUpcomingByGroup(groupId: string): Promise<readonly Event[]>
}
