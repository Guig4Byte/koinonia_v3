import type { Interaction } from '../entities/interaction.entity'

export interface InteractionRepository {
  create(data: Omit<Interaction, 'id' | 'createdAt'>): Promise<Interaction>
  findByPerson(personId: string): Promise<readonly Interaction[]>
  findByAuthor(authorId: string): Promise<readonly Interaction[]>
  findLastByPerson(personId: string): Promise<Interaction | null>
}
