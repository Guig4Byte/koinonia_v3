import { NextResponse } from "next/server";
import { domainErrorResponse, serverErrorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/get-current-user";
import { GroupPrismaRepository } from "@/app/api/_repositories/group.prisma-repository";
import { requireGroupAccess } from "@/app/api/_helpers/require-group-access";
import { writeAuditLog, extractIp } from "@/app/api/_helpers/audit-log";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getCurrentUser(request);

    if (!user) {
      return domainErrorResponse("UNAUTHORIZED");
    }

    const { id } = await params;

    const access = await requireGroupAccess(user, id);
    if (!access.ok) {
      return access.response;
    }

    const groupRepository = new GroupPrismaRepository();
    const group = await groupRepository.findById(id);

    if (!group) {
      return domainErrorResponse("GROUP_NOT_FOUND");
    }

    await writeAuditLog({
      userId: user.userId,
      churchId: user.churchId,
      action: "read",
      resource: "group",
      resourceId: id,
      details: "Visualização de célula",
      ip: extractIp(request),
    });

    return NextResponse.json({ group });
  } catch (error) {
    console.error("GET /api/groups/[id] failed", error);
    return serverErrorResponse();
  }
}
