export interface Event {
  readonly id: string
  readonly groupId: string
  readonly eventTypeId: string
  readonly scheduledAt: Date
  readonly occurredAt: Date | null
  readonly notes: string | null
  readonly createdAt: Date
  readonly deletedAt: Date | null
}
