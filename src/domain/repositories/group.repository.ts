import type { Group } from '../entities/group.entity'

export interface GroupRepository {
  findById(id: string): Promise<Group | null>
  findByChurch(churchId: string): Promise<readonly Group[]>
  findBySupervisor(supervisorUserId: string): Promise<readonly Group[]>
  findByLeader(leaderUserId: string): Promise<readonly Group[]>
}
