export type InteractionKind = 'call' | 'whatsapp' | 'visit' | 'prayer' | 'note'

export interface Interaction {
  readonly id: string
  readonly personId: string
  readonly authorId: string
  readonly kind: InteractionKind
  readonly content: string
  readonly createdAt: Date
}
