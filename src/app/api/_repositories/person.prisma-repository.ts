import type { Person } from "@/domain/entities/person.entity";
import type { PersonRepository } from "@/domain/repositories/person.repository";
import prisma from "@/lib/prisma";

function toDomainPerson(prismaPerson: {
  id: string;
  churchId: string;
  name: string;
  phone: string | null;
  photoUrl: string | null;
  birthDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Person {
  return {
    id: prismaPerson.id,
    churchId: prismaPerson.churchId,
    name: prismaPerson.name,
    phone: prismaPerson.phone,
    photoUrl: prismaPerson.photoUrl,
    birthDate: prismaPerson.birthDate,
    createdAt: prismaPerson.createdAt,
    updatedAt: prismaPerson.updatedAt,
    deletedAt: prismaPerson.deletedAt,
  };
}

export class PersonPrismaRepository implements PersonRepository {
  async findById(id: string): Promise<Person | null> {
    const person = await prisma.person.findFirst({
      where: { id, deletedAt: null },
    });
    return person ? toDomainPerson(person) : null;
  }

  async findByChurch(churchId: string): Promise<readonly Person[]> {
    const people = await prisma.person.findMany({
      where: { churchId, deletedAt: null },
      orderBy: { name: "asc" },
    });
    return people.map(toDomainPerson);
  }

  async findByGroup(groupId: string): Promise<readonly Person[]> {
    const memberships = await prisma.membership.findMany({
      where: { groupId, leftAt: null, person: { deletedAt: null } },
      include: { person: true },
      orderBy: { person: { name: "asc" } },
    });
    return memberships.map((m) => toDomainPerson(m.person));
  }

  async search(
    churchId: string,
    query: string,
    limit = 20,
  ): Promise<readonly Person[]> {
    const people = await prisma.person.findMany({
      where: {
        churchId,
        deletedAt: null,
        name: { contains: query, mode: "insensitive" },
      },
      take: limit,
      orderBy: { name: "asc" },
    });
    return people.map(toDomainPerson);
  }

  async findByUser(userId: string): Promise<Person | null> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { person: true },
    });
    return user?.person && !user.person.deletedAt
      ? toDomainPerson(user.person)
      : null;
  }
}
