export type TaskTarget = 'person' | 'group' | 'leader'

export interface Task {
  readonly id: string
  readonly assigneeId: string
  readonly targetType: TaskTarget
  readonly targetId: string
  readonly description: string
  readonly dueAt: Date
  readonly completedAt: Date | null
  readonly createdAt: Date
  readonly deletedAt: Date | null
}
