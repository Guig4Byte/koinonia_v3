import type { Attendance } from "@/domain/entities/attendance.entity";
import type { AttendanceRepository } from "@/domain/repositories/attendance.repository";
import prisma from "@/lib/prisma";

function toDomainAttendance(prismaAttendance: {
  id: string;
  eventId: string;
  personId: string;
  present: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Attendance {
  return {
    id: prismaAttendance.id,
    eventId: prismaAttendance.eventId,
    personId: prismaAttendance.personId,
    present: prismaAttendance.present,
    createdAt: prismaAttendance.createdAt,
    updatedAt: prismaAttendance.updatedAt,
  };
}

export class AttendancePrismaRepository implements AttendanceRepository {
  async findByEvent(eventId: string): Promise<readonly Attendance[]> {
    const attendances = await prisma.attendance.findMany({
      where: {
        eventId,
        event: { deletedAt: null },
        person: { deletedAt: null },
      },
    });
    return attendances.map(toDomainAttendance);
  }

  async findByPerson(
    personId: string,
    limit = 20,
  ): Promise<readonly Attendance[]> {
    const attendances = await prisma.attendance.findMany({
      where: {
        personId,
        person: { deletedAt: null },
        event: { deletedAt: null },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    return attendances.map(toDomainAttendance);
  }

  async registerForEvent(input: {
    readonly eventId: string;
    readonly occurredAt: Date;
    readonly attendances: ReadonlyArray<{
      readonly personId: string;
      readonly present: boolean;
    }>;
  }): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.event.updateMany({
        where: {
          id: input.eventId,
          deletedAt: null,
          occurredAt: null,
        },
        data: { occurredAt: input.occurredAt },
      });

      for (const attendance of input.attendances) {
        await tx.attendance.upsert({
          where: {
            eventId_personId: {
              eventId: input.eventId,
              personId: attendance.personId,
            },
          },
          update: { present: attendance.present },
          create: {
            eventId: input.eventId,
            personId: attendance.personId,
            present: attendance.present,
          },
        });
      }
    });
  }
}
