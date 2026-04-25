export interface Group {
  readonly id: string
  readonly churchId: string
  readonly name: string
  readonly leaderUserId: string | null
  readonly supervisorUserId: string | null
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly deletedAt: Date | null
}
