import prisma from "@/lib/prisma";
import {
  buildDashboard,
  type DashboardResult,
} from "@/domain/use-cases/dashboard/build-dashboard.use-case";

interface DashboardScope {
  churchId: string;
  supervisorUserId?: string;
}

async function getGroupsForDashboard(scope: DashboardScope) {
  return prisma.group.findMany({
    where: {
      churchId: scope.churchId,
      ...(scope.supervisorUserId ? { supervisorUserId: scope.supervisorUserId } : {}),
      deletedAt: null,
    },
    include: {
      memberships: {
        where: { leftAt: null, person: { deletedAt: null } },
        include: {
          person: {
            include: {
              riskScore: true,
              interactionsAsSubject: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
      },
      events: {
        where: { deletedAt: null },
        orderBy: { scheduledAt: "desc" },
        take: 6,
        include: {
          attendances: {
            where: { person: { deletedAt: null } },
          },
        },
      },
    },
  });
}

function getDashboardUserIds(
  groups: Awaited<ReturnType<typeof getGroupsForDashboard>>,
): string[] {
  return Array.from(
    new Set(
      groups.flatMap((group) => [group.leaderUserId, group.supervisorUserId]).filter((id): id is string =>
        Boolean(id),
      ),
    ),
  );
}

async function getUserNameMap(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      deletedAt: null,
      person: { deletedAt: null },
    },
    select: { id: true, person: { select: { name: true } } },
  });

  const userNameMap = new Map<string, string>();
  users.forEach((user) => {
    if (user.person?.name) {
      userNameMap.set(user.id, user.person.name);
    }
  });

  return userNameMap;
}

async function getOverdueTasksForDashboard(scope: DashboardScope) {
  return prisma.task.findMany({
    where: {
      group: {
        churchId: scope.churchId,
        ...(scope.supervisorUserId ? { supervisorUserId: scope.supervisorUserId } : {}),
        deletedAt: null,
      },
      assignee: { deletedAt: null, person: { deletedAt: null } },
      completedAt: null,
      dueAt: { lt: new Date() },
      deletedAt: null,
    },
    include: {
      assignee: { select: { id: true, person: { select: { name: true } } } },
      group: { select: { id: true, name: true } },
    },
  });
}

async function getDashboard(scope: DashboardScope): Promise<DashboardResult> {
  const groups = await getGroupsForDashboard(scope);
  const userNameMap = await getUserNameMap(getDashboardUserIds(groups));
  const overdueTasks = await getOverdueTasksForDashboard(scope);

  return buildDashboard(groups, overdueTasks, userNameMap, {
    audience: scope.supervisorUserId ? "supervisor" : "pastor",
  });
}

export function getPastorDashboard(churchId: string): Promise<DashboardResult> {
  return getDashboard({ churchId });
}

export function getSupervisorDashboard(
  churchId: string,
  supervisorUserId: string,
): Promise<DashboardResult> {
  return getDashboard({ churchId, supervisorUserId });
}
