import { NextResponse } from "next/server";
import { domainErrorResponse, serverErrorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/get-current-user";
import { PersonPrismaRepository } from "@/app/api/_repositories/person.prisma-repository";
import { searchPeopleUseCase } from "@/domain/use-cases/dashboard/search-people.use-case";
import { searchPeopleQuerySchema } from "@/lib/validations/people/search";
import { writeAuditLog, extractIp } from "@/app/api/_helpers/audit-log";
import { canAccessApiRoute } from "@/lib/api-authorization";

export async function GET(request: Request) {
  try {
    const user = getCurrentUser(request);

    if (!user) {
      return domainErrorResponse("UNAUTHORIZED");
    }

    if (!canAccessApiRoute(user, "people:search")) {
      return domainErrorResponse("FORBIDDEN");
    }

    const { searchParams } = new URL(request.url);
    const rawSearch = searchParams.get("search") ?? "";

    const parsedQuery = searchPeopleQuerySchema.safeParse({
      search: rawSearch,
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "Termo de busca inválido." },
        { status: 400 },
      );
    }

    const personRepository = new PersonPrismaRepository();
    const people = await searchPeopleUseCase(personRepository, {
      churchId: user.churchId,
      query: parsedQuery.data.search,
      limit: 20,
    });

    await writeAuditLog({
      userId: user.userId,
      churchId: user.churchId,
      action: "read",
      resource: "person",
      resourceId: "search",
      details: `Busca por "${parsedQuery.data.search}" (${people.length} resultados)`,
      ip: extractIp(request),
    });

    return NextResponse.json({ people });
  } catch (error) {
    console.error("GET /api/people failed", error);
    return serverErrorResponse();
  }
}
