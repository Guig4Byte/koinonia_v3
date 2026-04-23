import type { Task } from '../entities/task.entity'

export interface TaskRepository {
  findById(id: string): Promise<Task | null>
  findByAssignee(assigneeId: string): Promise<readonly Task[]>
  findPendingByAssignee(assigneeId: string): Promise<readonly Task[]>
  findOverdueByAssignee(assigneeId: string): Promise<readonly Task[]>
  create(data: Omit<Task, 'id' | 'createdAt'>): Promise<Task>
  complete(id: string): Promise<Task | null>
}
