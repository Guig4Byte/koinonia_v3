export interface Attendance {
  readonly id: string
  readonly eventId: string
  readonly personId: string
  readonly present: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
}
