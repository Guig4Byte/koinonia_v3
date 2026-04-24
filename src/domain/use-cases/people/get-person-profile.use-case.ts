import { err, ok, type Result } from "neverthrow";
import type { Person } from "@/domain/entities/person.entity";
import type { PersonRepository } from "@/domain/repositories/person.repository";
import { DomainErrors } from "@/domain/errors/domain-errors";

export async function getPersonProfileUseCase(
  personRepository: PersonRepository,
  personId: string,
): Promise<Result<Person, typeof DomainErrors.PERSON_NOT_FOUND>> {
  const person = await personRepository.findById(personId);

  if (!person) {
    return err(DomainErrors.PERSON_NOT_FOUND);
  }

  return ok(person);
}
