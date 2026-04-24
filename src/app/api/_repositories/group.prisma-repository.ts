import type { Group } from "@/domain/entities/group.entity";
import type { GroupRepository } from "@/domain/repositories/group.repository";
import prisma from "@/lib/prisma";

function toDomainGroup(prismaGroup: {
  id: string;
  churchId: string;
  name: string;
  leaderId: string | null;
  supervisorId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Group {
  return {
    id: prismaGroup.id,
    churchId: prismaGroup.churchId,
    name: prismaGroup.name,
    leaderId: prismaGroup.leaderId,
    supervisorId: prismaGroup.supervisorId,
    createdAt: prismaGroup.createdAt,
    updatedAt: prismaGroup.updatedAt,
    deletedAt: prismaGroup.deletedAt,
  };
}

export class GroupPrismaRepository implements GroupRepository {
  async findById(id: string): Promise<Group | null> {
    const group = await prisma.group.findUnique({ where: { id } });
    return group ? toDomainGroup(group) : null;
  }

  async findByChurch(churchId: string): Promise<readonly Group[]> {
    const groups = await prisma.group.findMany({
      where: { churchId },
      orderBy: { name: "asc" },
    });
    return groups.map(toDomainGroup);
  }

  async findBySupervisor(
    supervisorId: string,
  ): Promise<readonly Group[]> {
    const groups = await prisma.group.findMany({
      where: { supervisorId },
      orderBy: { name: "asc" },
    });
    return groups.map(toDomainGroup);
  }

  async findByLeader(leaderId: string): Promise<readonly Group[]> {
    const groups = await prisma.group.findMany({
      where: { leaderId },
      orderBy: { name: "asc" },
    });
    return groups.map(toDomainGroup);
  }
}
