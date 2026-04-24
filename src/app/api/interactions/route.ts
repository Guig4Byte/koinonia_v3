import { NextResponse } from "next/server";
import {
  domainErrorResponse,
  invalidJsonResponse,
  serverErrorResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { getCurrentUser } from "@/lib/get-current-user";
import { InteractionPrismaRepository } from "@/app/api/_repositories/interaction.prisma-repository";
import { createInteractionUseCase } from "@/domain/use-cases/interactions/create-interaction.use-case";
import { createInteractionSchema } from "@/lib/validations/interactions/create";
import { writeAuditLog, extractIp } from "@/app/api/_helpers/audit-log";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = getCurrentUser(request);

    if (!user) {
      return domainErrorResponse("UNAUTHORIZED");
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return invalidJsonResponse();
    }

    const parsedBody = createInteractionSchema.safeParse(body);

    if (!parsedBody.success) {
      return validationErrorResponse(parsedBody.error);
    }

    // Church scoping: só pode interagir com pessoas da própria igreja
    const targetPerson = await prisma.person.findUnique({
      where: { id: parsedBody.data.personId },
      select: { churchId: true },
    });

    if (!targetPerson || targetPerson.churchId !== user.churchId) {
      return domainErrorResponse("UNAUTHORIZED");
    }

    const interactionRepository = new InteractionPrismaRepository();

    const interaction = await createInteractionUseCase(interactionRepository, {
      personId: parsedBody.data.personId,
      authorId: user.personId,
      kind: parsedBody.data.kind,
      content: parsedBody.data.content,
    });

    writeAuditLog({
      userId: user.userId,
      action: "create",
      resource: "interaction",
      resourceId: interaction.id,
      details: `Interação do tipo ${interaction.kind}`,
      ip: extractIp(request),
    });

    return NextResponse.json({ interaction }, { status: 201 });
  } catch (error) {
    console.error("POST /api/interactions failed", error);
    return serverErrorResponse();
  }
}
