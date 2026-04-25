import { NextResponse } from "next/server";
import {
  domainErrorResponse,
  invalidJsonResponse,
  serverErrorResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { onboardChurch } from "@/lib/auth-service";
import { setRefreshTokenCookie } from "@/lib/auth-cookies";
import { onboardingSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return invalidJsonResponse();
    }

    const parsedBody = onboardingSchema.safeParse(body);

    if (!parsedBody.success) {
      return validationErrorResponse(parsedBody.error);
    }

    const result = await onboardChurch(parsedBody.data);

    if (result.isErr()) {
      return domainErrorResponse(result.error);
    }

    const { refreshToken, ...responseBody } = result.value;
    const response = NextResponse.json(responseBody, { status: 201 });
    setRefreshTokenCookie(response, refreshToken);

    return response;
  } catch (error) {
    console.error("POST /api/auth/onboarding failed", error);
    return serverErrorResponse();
  }
}
