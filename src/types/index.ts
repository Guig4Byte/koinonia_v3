export const APP_ROLES = ["pastor", "supervisor", "leader", "host", "member"] as const;
export const MEMBERSHIP_ROLES = ["member", "host"] as const;
export const EVENT_KINDS = [
  "community_bond",
  "belonging",
  "development",
  "commitment",
] as const;
export const INTERACTION_KINDS = ["call", "whatsapp", "visit", "prayer", "note"] as const;
export const NEED_KINDS = ["prayer", "social", "counseling"] as const;
export const PRIORITIES = ["low", "medium", "high"] as const;
export const TASK_TARGETS = ["person", "group", "leader"] as const;
export const RISK_LEVELS = ["green", "yellow", "red"] as const;

export type AppRole = (typeof APP_ROLES)[number];
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];
export type EventKind = (typeof EVENT_KINDS)[number];
export type InteractionKind = (typeof INTERACTION_KINDS)[number];
export type NeedKind = (typeof NEED_KINDS)[number];
export type PriorityLevel = (typeof PRIORITIES)[number];
export type TaskTarget = (typeof TASK_TARGETS)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface AuthUser {
  id: string;
  email: string;
  role: AppRole;
  personId: string;
  churchId: string;
}

export interface SeedAccount {
  name: string;
  email: string;
  role: AppRole;
  password: string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  percentage: number;
}
