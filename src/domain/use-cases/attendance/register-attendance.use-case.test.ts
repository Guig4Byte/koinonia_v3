// @vitest-environment node

import { describe, it, expect, vi } from "vitest";
import { registerAttendanceUseCase } from "./register-attendance.use-case";
import { DomainErrors } from "@/domain/errors/domain-errors";
import type { EventRepository } from "@/domain/repositories/event.repository";
import type { AttendanceRepository } from "@/domain/repositories/attendance.repository";
import type { PersonRepository } from "@/domain/repositories/person.repository";

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
    registerForEvent: vi.fn(),
    ...overrides,
  };
}

function createMockPersonRepository(
  overrides?: Partial<PersonRepository>,
): PersonRepository {
  return {
    findById: vi.fn(),
    findByChurch: vi.fn(),
    findByGroup: vi.fn(),
    search: vi.fn(),
    findByUser: vi.fn(),
    ...overrides,
  };
}

function createPerson(id: string) {
  return {
    id,
    churchId: "c1",
    name: id,
    phone: null,
    photoUrl: null,
    birthDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
}

describe("registerAttendanceUseCase", () => {
  it("registra presenças e retorna resumo", async () => {
    const occurredAt = new Date("2024-01-10T19:00:00.000Z");
    const eventRepository = createMockEventRepository({
      findById: vi.fn().mockResolvedValue({
        id: "event-1",
        groupId: "group-1",
        eventTypeId: "type-1",
        scheduledAt: occurredAt,
        occurredAt,
        notes: null,
        createdAt: new Date(),
        deletedAt: null,
      }),
    });

    const attendanceRepository = createMockAttendanceRepository({
      registerForEvent: vi.fn().mockResolvedValue(undefined),
    });

    const personRepository = createMockPersonRepository({
      findByGroup: vi
        .fn()
        .mockResolvedValue([createPerson("p1"), createPerson("p2"), createPerson("p3")]),
    });

    const attendances = [
      { personId: "p1", present: true },
      { personId: "p2", present: false },
      { personId: "p3", present: true },
    ];

    const result = await registerAttendanceUseCase(
      eventRepository,
      attendanceRepository,
      personRepository,
      {
        eventId: "event-1",
        attendances,
      },
    );

    expect(result.isOk()).toBe(true);
    expect(attendanceRepository.registerForEvent).toHaveBeenCalledWith({
      eventId: "event-1",
      occurredAt,
      attendances,
    });
    if (result.isOk()) {
      expect(result.value.total).toBe(3);
      expect(result.value.present).toBe(2);
      expect(result.value.absent).toBe(1);
    }
  });

  it("marca o evento como realizado quando a presença é registrada pela primeira vez", async () => {
    const scheduledAt = new Date("2024-01-10T19:00:00.000Z");
    const eventRepository = createMockEventRepository({
      findById: vi.fn().mockResolvedValue({
        id: "event-1",
        groupId: "group-1",
        eventTypeId: "type-1",
        scheduledAt,
        occurredAt: null,
        notes: null,
        createdAt: new Date(),
        deletedAt: null,
      }),
    });

    const attendanceRepository = createMockAttendanceRepository({
      registerForEvent: vi.fn().mockResolvedValue(undefined),
    });

    const personRepository = createMockPersonRepository({
      findByGroup: vi.fn().mockResolvedValue([createPerson("p1")]),
    });

    const attendances = [{ personId: "p1", present: true }];

    const result = await registerAttendanceUseCase(
      eventRepository,
      attendanceRepository,
      personRepository,
      {
        eventId: "event-1",
        attendances,
      },
    );

    expect(result.isOk()).toBe(true);
    expect(attendanceRepository.registerForEvent).toHaveBeenCalledWith({
      eventId: "event-1",
      occurredAt: scheduledAt,
      attendances,
    });
  });

  it("retorna INVALID_ATTENDEES quando há pessoa duplicada no payload", async () => {
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
      registerForEvent: vi.fn().mockResolvedValue(undefined),
    });

    const personRepository = createMockPersonRepository({
      findByGroup: vi.fn().mockResolvedValue([createPerson("p1")]),
    });

    const result = await registerAttendanceUseCase(
      eventRepository,
      attendanceRepository,
      personRepository,
      {
        eventId: "event-1",
        attendances: [
          { personId: "p1", present: true },
          { personId: "p1", present: false },
        ],
      },
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe(DomainErrors.INVALID_ATTENDEES);
    }
    expect(attendanceRepository.registerForEvent).not.toHaveBeenCalled();
  });

  it("retorna EVENT_NOT_FOUND quando o evento não existe", async () => {
    const eventRepository = createMockEventRepository({
      findById: vi.fn().mockResolvedValue(null),
    });

    const result = await registerAttendanceUseCase(
      eventRepository,
      createMockAttendanceRepository(),
      createMockPersonRepository(),
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

  it("retorna INVALID_ATTENDEES quando alguma pessoa não pertence ao grupo", async () => {
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

    const personRepository = createMockPersonRepository({
      findByGroup: vi.fn().mockResolvedValue([createPerson("p1")]),
    });

    const result = await registerAttendanceUseCase(
      eventRepository,
      createMockAttendanceRepository(),
      personRepository,
      {
        eventId: "event-1",
        attendances: [
          { personId: "p1", present: true },
          { personId: "p2", present: false },
        ],
      },
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe(DomainErrors.INVALID_ATTENDEES);
    }
  });
});
