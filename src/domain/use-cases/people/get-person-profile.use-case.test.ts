// @vitest-environment node

import { describe, it, expect, vi } from "vitest";
import { getPersonProfileUseCase } from "./get-person-profile.use-case";
import { DomainErrors } from "@/domain/errors/domain-errors";
import type { PersonRepository } from "@/domain/repositories/person.repository";

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

describe("getPersonProfileUseCase", () => {
  it("retorna a pessoa quando encontrada", async () => {
    const mockPerson = {
      id: "person-1",
      churchId: "church-1",
      name: "Cláudio Mendes",
      phone: "+55 11 98888-0001",
      photoUrl: null,
      birthDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const repository = createMockPersonRepository({
      findById: vi.fn().mockResolvedValue(mockPerson),
    });

    const result = await getPersonProfileUseCase(repository, "person-1");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.name).toBe("Cláudio Mendes");
    }
  });

  it("retorna PERSON_NOT_FOUND quando a pessoa não existe", async () => {
    const repository = createMockPersonRepository({
      findById: vi.fn().mockResolvedValue(null),
    });

    const result = await getPersonProfileUseCase(repository, "person-404");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe(DomainErrors.PERSON_NOT_FOUND);
    }
  });
});
