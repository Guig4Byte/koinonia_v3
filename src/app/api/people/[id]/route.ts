import { NextResponse } from "next/server";
import {
  domainErrorResponse,
  serverErrorResponse,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/get-current-user";
import { PersonPrismaRepository } from "@/app/api/_repositories/person.prisma-repository";
import { getPersonProfileUseCase } from "@/domain/use-cases/people/get-person-profile.use-case";
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

    const personRepository = new PersonPrismaRepository();
    const result = await getPersonProfileUseCase(personRepository, id);

    if (result.isErr()) {
      return domainErrorResponse(result.error);
    }

    // Church scoping: só pode ver pessoas da própria igreja
    if (result.value.churchId !== user.churchId) {
      return domainErrorResponse("UNAUTHORIZED");
    }

    writeAuditLog({
      userId: user.userId,
      action: "read",
      resource: "person",
      resourceId: id,
      details: "Visualização de perfil",
      ip: extractIp(request),
    });

    return NextResponse.json({ person: result.value });
  } catch (error) {
    console.error("GET /api/people/[id] failed", error);
    return serverErrorResponse();
  }
}
