export interface Person {
  readonly id: string
  readonly churchId: string
  readonly name: string
  readonly phone: string | null
  readonly photoUrl: string | null
  readonly birthDate: Date | null
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly deletedAt: Date | null
}
