import type { Group } from "@/domain/entities/group.entity";
import type { GroupRepository } from "@/domain/repositories/group.repository";
import prisma from "@/lib/prisma";

function toDomainGroup(prismaGroup: {
  id: string;
  churchId: string;
  name: string;
  leaderUserId: string | null;
  supervisorUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Group {
  return {
    id: prismaGroup.id,
    churchId: prismaGroup.churchId,
    name: prismaGroup.name,
    leaderUserId: prismaGroup.leaderUserId,
    supervisorUserId: prismaGroup.supervisorUserId,
    createdAt: prismaGroup.createdAt,
    updatedAt: prismaGroup.updatedAt,
    deletedAt: prismaGroup.deletedAt,
  };
}

export class GroupPrismaRepository implements GroupRepository {
  async findById(id: string): Promise<Group | null> {
    const group = await prisma.group.findFirst({
      where: { id, deletedAt: null },
    });
    return group ? toDomainGroup(group) : null;
  }

  async findByChurch(churchId: string): Promise<readonly Group[]> {
    const groups = await prisma.group.findMany({
      where: { churchId, deletedAt: null },
      orderBy: { name: "asc" },
    });
    return groups.map(toDomainGroup);
  }

  async findBySupervisor(supervisorUserId: string): Promise<readonly Group[]> {
    const groups = await prisma.group.findMany({
      where: { supervisorUserId, deletedAt: null },
      orderBy: { name: "asc" },
    });
    return groups.map(toDomainGroup);
  }

  async findByLeader(leaderUserId: string): Promise<readonly Group[]> {
    const groups = await prisma.group.findMany({
      where: { leaderUserId, deletedAt: null },
      orderBy: { name: "asc" },
    });
    return groups.map(toDomainGroup);
  }
}
