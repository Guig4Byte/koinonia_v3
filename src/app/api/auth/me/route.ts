import { NextResponse } from "next/server";
import { domainErrorResponse, serverErrorResponse } from "@/lib/api-response";
import { extractBearerToken } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/auth-service";
import { DomainErrors } from "@/domain/errors/domain-errors";

export async function GET(request: Request) {
  try {
    const accessToken = extractBearerToken(
      request.headers.get("authorization"),
    );

    if (!accessToken) {
      return domainErrorResponse(DomainErrors.TOKEN_INVALID);
    }

    const result = await getAuthenticatedUser({ accessToken });

    if (result.isErr()) {
      return domainErrorResponse(result.error);
    }

    return NextResponse.json({
      user: result.value,
    });
  } catch (error) {
    console.error("GET /api/auth/me failed", error);
    return serverErrorResponse();
  }
}
