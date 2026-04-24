import type { Interaction } from "@/domain/entities/interaction.entity";
import type { InteractionRepository } from "@/domain/repositories/interaction.repository";

export async function createInteractionUseCase(
  interactionRepository: InteractionRepository,
  input: {
    personId: string;
    authorId: string;
    kind: Interaction["kind"];
    content: string;
  },
): Promise<Interaction> {
  return interactionRepository.create({
    personId: input.personId,
    authorId: input.authorId,
    kind: input.kind,
    content: input.content,
  });
}
