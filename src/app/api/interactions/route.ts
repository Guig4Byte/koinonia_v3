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
    const targetPerson = await prisma.person.findFirst({
      where: { id: parsedBody.data.personId, deletedAt: null },
      select: { churchId: true },
    });

    if (!targetPerson || targetPerson.churchId !== user.churchId) {
      return domainErrorResponse("UNAUTHORIZED");
    }

    const interaction = await prisma.$transaction(async (tx) => {
      const interactionRepository = new InteractionPrismaRepository(tx);

      const createdInteraction = await createInteractionUseCase(
        interactionRepository,
        {
          personId: parsedBody.data.personId,
          authorId: user.personId,
          kind: parsedBody.data.kind,
          content: parsedBody.data.content,
        },
      );

      await writeAuditLog(
        {
          userId: user.userId,
          churchId: user.churchId,
          action: "create",
          resource: "interaction",
          resourceId: createdInteraction.id,
          details: `Interação do tipo ${createdInteraction.kind}`,
          ip: extractIp(request),
        },
        tx,
      );

      return createdInteraction;
    });

    return NextResponse.json({ interaction }, { status: 201 });
  } catch (error) {
    console.error("POST /api/interactions failed", error);
    return serverErrorResponse();
  }
}
