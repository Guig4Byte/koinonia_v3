// @vitest-environment node

import { describe, it, expect, vi } from "vitest";
import { getGroupHealthUseCase } from "./get-group-health.use-case";
import { DomainErrors } from "@/domain/errors/domain-errors";
import type { GroupRepository } from "@/domain/repositories/group.repository";
import type { PersonRepository } from "@/domain/repositories/person.repository";
import type { EventRepository } from "@/domain/repositories/event.repository";
import type { AttendanceRepository } from "@/domain/repositories/attendance.repository";

function createMockGroupRepository(
  overrides?: Partial<GroupRepository>,
): GroupRepository {
  return {
    findById: vi.fn(),
    findByChurch: vi.fn(),
    findBySupervisor: vi.fn(),
    findByLeader: vi.fn(),
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

describe("getGroupHealthUseCase", () => {
  it("retorna saúde da célula com presença calculada", async () => {
    const groupRepository = createMockGroupRepository({
      findById: vi.fn().mockResolvedValue({
        id: "group-1",
        churchId: "church-1",
        name: "Esperança",
        leaderId: "leader-1",
        supervisorId: "super-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }),
    });

    const personRepository = createMockPersonRepository({
      findByGroup: vi.fn().mockResolvedValue([
        { id: "p1", name: "M1" },
        { id: "p2", name: "M2" },
      ] as unknown as Awaited<ReturnType<PersonRepository["findByGroup"]>>),
    });

    const eventRepository = createMockEventRepository({
      findByGroup: vi.fn().mockResolvedValue([
        {
          id: "event-1",
          groupId: "group-1",
          eventTypeId: "type-1",
          scheduledAt: new Date(),
          occurredAt: new Date(),
          notes: null,
          createdAt: new Date(),
          deletedAt: null,
        },
      ]),
    });

    const attendanceRepository = createMockAttendanceRepository({
      findByEvent: vi.fn().mockResolvedValue([
        { id: "a1", eventId: "event-1", personId: "p1", present: true, createdAt: new Date(), updatedAt: new Date() },
        { id: "a2", eventId: "event-1", personId: "p2", present: false, createdAt: new Date(), updatedAt: new Date() },
      ]),
    });

    const result = await getGroupHealthUseCase(
      groupRepository,
      personRepository,
      eventRepository,
      attendanceRepository,
      "group-1",
    );

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.groupName).toBe("Esperança");
      expect(result.value.totalMembers).toBe(2);
      expect(result.value.averageAttendancePercentage).toBe(50);
    }
  });

  it("retorna GROUP_NOT_FOUND quando a célula não existe", async () => {
    const groupRepository = createMockGroupRepository({
      findById: vi.fn().mockResolvedValue(null),
    });

    const result = await getGroupHealthUseCase(
      groupRepository,
      createMockPersonRepository(),
      createMockEventRepository(),
      createMockAttendanceRepository(),
      "group-404",
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe(DomainErrors.GROUP_NOT_FOUND);
    }
  });
});
