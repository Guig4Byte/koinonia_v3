import type { Person } from "@/domain/entities/person.entity";
import type { PersonRepository } from "@/domain/repositories/person.repository";

export async function searchPeopleUseCase(
  personRepository: PersonRepository,
  input: {
    churchId: string;
    query: string;
    limit?: number;
  },
): Promise<readonly Person[]> {
  return personRepository.search(input.churchId, input.query, input.limit);
}
