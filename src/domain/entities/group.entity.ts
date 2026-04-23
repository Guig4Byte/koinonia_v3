export interface Group {
  readonly id: string
  readonly churchId: string
  readonly name: string
  readonly leaderId: string | null
  readonly supervisorId: string | null
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly deletedAt: Date | null
}
