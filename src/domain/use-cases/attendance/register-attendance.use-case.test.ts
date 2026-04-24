// @vitest-environment node

import { describe, it, expect, vi } from "vitest";
import { registerAttendanceUseCase } from "./register-attendance.use-case";
import { DomainErrors } from "@/domain/errors/domain-errors";
import type { EventRepository } from "@/domain/repositories/event.repository";
import type { AttendanceRepository } from "@/domain/repositories/attendance.repository";

function createMockEventRepository(
  overrides?: Partial<EventRepository>,
): EventRepository {
  return {
    findById: vi.fn(),
    findByGroup: vi.fn(),
    findByChurch: vi.fn(),
    findUpcomingByGroup: vi.fn(),
    ...overrides,
  };
}

function createMockAttendanceRepository(
  overrides?: Partial<AttendanceRepository>,
): AttendanceRepository {
  return {
    findByEvent: vi.fn(),
    findByPerson: vi.fn(),
    upsertMany: vi.fn(),
    ...overrides,
  };
}

describe("registerAttendanceUseCase", () => {
  it("registra presenças e retorna resumo", async () => {
    const eventRepository = createMockEventRepository({
      findById: vi.fn().mockResolvedValue({
        id: "event-1",
        groupId: "group-1",
        eventTypeId: "type-1",
        scheduledAt: new Date(),
        occurredAt: new Date(),
        notes: null,
        createdAt: new Date(),
        deletedAt: null,
      }),
    });

    const attendanceRepository = createMockAttendanceRepository({
      upsertMany: vi.fn().mockResolvedValue(undefined),
    });

    const result = await registerAttendanceUseCase(
      eventRepository,
      attendanceRepository,
      {
        eventId: "event-1",
        attendances: [
          { personId: "p1", present: true },
          { personId: "p2", present: false },
          { personId: "p3", present: true },
        ],
      },
    );

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.total).toBe(3);
      expect(result.value.present).toBe(2);
      expect(result.value.absent).toBe(1);
    }
  });

  it("retorna EVENT_NOT_FOUND quando o evento não existe", async () => {
    const eventRepository = createMockEventRepository({
      findById: vi.fn().mockResolvedValue(null),
    });

    const result = await registerAttendanceUseCase(
      eventRepository,
      createMockAttendanceRepository(),
      {
        eventId: "event-404",
        attendances: [{ personId: "p1", present: true }],
      },
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe(DomainErrors.EVENT_NOT_FOUND);
    }
  });
});
