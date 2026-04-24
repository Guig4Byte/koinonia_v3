// @vitest-environment node

import { describe, it, expect, vi } from "vitest";
import { searchPeopleUseCase } from "./search-people.use-case";
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

describe("searchPeopleUseCase", () => {
  it("retorna lista de pessoas filtradas pela busca", async () => {
    const mockPeople = [
      {
        id: "person-1",
        churchId: "church-1",
        name: "Cláudio Mendes",
        phone: null,
        photoUrl: null,
        birthDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ];

    const repository = createMockPersonRepository({
      search: vi.fn().mockResolvedValue(mockPeople),
    });

    const result = await searchPeopleUseCase(repository, {
      churchId: "church-1",
      query: "Clau",
      limit: 20,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Cláudio Mendes");
    expect(repository.search).toHaveBeenCalledWith("church-1", "Clau", 20);
  });
});
