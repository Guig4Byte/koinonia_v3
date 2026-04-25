import { NextResponse } from "next/server";
import { domainErrorResponse, serverErrorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/get-current-user";
import { requireRole } from "@/lib/role-guard";
import { writeAuditLog, extractIp } from "@/app/api/_helpers/audit-log";
import { getSupervisorDashboard } from "@/app/api/_services/dashboard.service";

export async function GET(request: Request) {
  try {
    const user = getCurrentUser(request);

    if (!user) {
      return domainErrorResponse("UNAUTHORIZED");
    }

    const roleCheck = requireRole(user.role, ["supervisor"]);
    if (!roleCheck.authorized) {
      return domainErrorResponse(roleCheck.error);
    }

    const dashboard = await getSupervisorDashboard(user.churchId, user.userId);

    await writeAuditLog({
      userId: user.userId,
      churchId: user.churchId,
      action: "read",
      resource: "group",
      resourceId: user.churchId,
      details: "Dashboard do supervisor",
      ip: extractIp(request),
    });

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error("GET /api/supervisor/dashboard failed", error);
    return serverErrorResponse();
  }
}
