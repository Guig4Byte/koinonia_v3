import type { Event } from "@/domain/entities/event.entity";
import type { EventRepository } from "@/domain/repositories/event.repository";
import prisma from "@/lib/prisma";

function toDomainEvent(prismaEvent: {
  id: string;
  groupId: string;
  eventTypeId: string;
  scheduledAt: Date;
  occurredAt: Date | null;
  notes: string | null;
  createdAt: Date;
  deletedAt: Date | null;
}): Event {
  return {
    id: prismaEvent.id,
    groupId: prismaEvent.groupId,
    eventTypeId: prismaEvent.eventTypeId,
    scheduledAt: prismaEvent.scheduledAt,
    occurredAt: prismaEvent.occurredAt,
    notes: prismaEvent.notes,
    createdAt: prismaEvent.createdAt,
    deletedAt: prismaEvent.deletedAt,
  };
}

export class EventPrismaRepository implements EventRepository {
  async findById(id: string): Promise<Event | null> {
    const event = await prisma.event.findFirst({
      where: { id, deletedAt: null, group: { deletedAt: null } },
    });
    return event ? toDomainEvent(event) : null;
  }

  async findByGroup(groupId: string): Promise<readonly Event[]> {
    const events = await prisma.event.findMany({
      where: { groupId, deletedAt: null, group: { deletedAt: null } },
      orderBy: { scheduledAt: "desc" },
    });
    return events.map(toDomainEvent);
  }

  async findByChurch(churchId: string): Promise<readonly Event[]> {
    const events = await prisma.event.findMany({
      where: { group: { churchId, deletedAt: null }, deletedAt: null },
      orderBy: { scheduledAt: "desc" },
    });
    return events.map(toDomainEvent);
  }

  async findUpcomingByGroup(groupId: string): Promise<readonly Event[]> {
    const events = await prisma.event.findMany({
      where: {
        groupId,
        deletedAt: null,
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: "asc" },
    });
    return events.map(toDomainEvent);
  }
}
