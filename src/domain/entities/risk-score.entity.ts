export type RiskLevel = 'green' | 'yellow' | 'red'

export interface RiskScore {
  readonly id: string
  readonly personId: string
  readonly score: number // 0–100
  readonly level: RiskLevel
  readonly reasons: readonly string[]
  readonly updatedAt: Date
}
