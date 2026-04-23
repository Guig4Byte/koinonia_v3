import type { Group } from '../entities/group.entity'

export interface GroupRepository {
  findById(id: string): Promise<Group | null>
  findByChurch(churchId: string): Promise<readonly Group[]>
  findBySupervisor(supervisorId: string): Promise<readonly Group[]>
  findByLeader(leaderId: string): Promise<readonly Group[]>
}
