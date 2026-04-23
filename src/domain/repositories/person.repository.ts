import type { Person } from '../entities/person.entity'

export interface PersonRepository {
  findById(id: string): Promise<Person | null>
  findByChurch(churchId: string): Promise<readonly Person[]>
  findByGroup(groupId: string): Promise<readonly Person[]>
  search(churchId: string, query: string, limit?: number): Promise<readonly Person[]>
  findByUser(userId: string): Promise<Person | null>
}
