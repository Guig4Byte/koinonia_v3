import type { Interaction } from "@/domain/entities/interaction.entity";
import type { InteractionRepository } from "@/domain/repositories/interaction.repository";
import prisma from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@prisma/client";

type InteractionPrismaClient = PrismaClient | Prisma.TransactionClient;

function toDomainInteraction(prismaInteraction: {
  id: string;
  personId: string;
  authorId: string;
  kind: string;
  content: string;
  createdAt: Date;
}): Interaction {
  return {
    id: prismaInteraction.id,
    personId: prismaInteraction.personId,
    authorId: prismaInteraction.authorId,
    kind: prismaInteraction.kind as Interaction["kind"],
    content: prismaInteraction.content,
    createdAt: prismaInteraction.createdAt,
  };
}

export class InteractionPrismaRepository implements InteractionRepository {
  constructor(private readonly client: InteractionPrismaClient = prisma) {}

  async create(
    data: Omit<Interaction, "id" | "createdAt">,
  ): Promise<Interaction> {
    const interaction = await this.client.interaction.create({
      data: {
        personId: data.personId,
        authorId: data.authorId,
        kind: data.kind,
        content: data.content,
      },
    });
    return toDomainInteraction(interaction);
  }

  async findByPerson(personId: string): Promise<readonly Interaction[]> {
    const interactions = await this.client.interaction.findMany({
      where: { personId },
      orderBy: { createdAt: "desc" },
    });
    return interactions.map(toDomainInteraction);
  }

  async findByAuthor(authorId: string): Promise<readonly Interaction[]> {
    const interactions = await this.client.interaction.findMany({
      where: { authorId },
      orderBy: { createdAt: "desc" },
    });
    return interactions.map(toDomainInteraction);
  }

  async findLastByPerson(personId: string): Promise<Interaction | null> {
    const interaction = await this.client.interaction.findFirst({
      where: { personId },
      orderBy: { createdAt: "desc" },
    });
    return interaction ? toDomainInteraction(interaction) : null;
  }
}
