// @vitest-environment node

import { describe, it, expect, vi } from "vitest";
import { createInteractionUseCase } from "./create-interaction.use-case";
import type { InteractionRepository } from "@/domain/repositories/interaction.repository";

function createMockInteractionRepository(
  overrides?: Partial<InteractionRepository>,
): InteractionRepository {
  return {
    create: vi.fn(),
    findByPerson: vi.fn(),
    findByAuthor: vi.fn(),
    findLastByPerson: vi.fn(),
    ...overrides,
  };
}

describe("createInteractionUseCase", () => {
  it("cria uma interação e retorna o resultado", async () => {
    const mockInteraction = {
      id: "interaction-1",
      personId: "person-1",
      authorId: "author-1",
      kind: "visit" as const,
      content: "Visitou em casa. Está bem.",
      createdAt: new Date(),
    };

    const repository = createMockInteractionRepository({
      create: vi.fn().mockResolvedValue(mockInteraction),
    });

    const result = await createInteractionUseCase(repository, {
      personId: "person-1",
      authorId: "author-1",
      kind: "visit",
      content: "Visitou em casa. Está bem.",
    });

    expect(result.id).toBe("interaction-1");
    expect(result.kind).toBe("visit");
    expect(repository.create).toHaveBeenCalledWith({
      personId: "person-1",
      authorId: "author-1",
      kind: "visit",
      content: "Visitou em casa. Está bem.",
    });
  });
});
