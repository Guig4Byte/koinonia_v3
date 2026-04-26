import { NextResponse } from "next/server";
import {
  domainErrorResponse,
  invalidJsonResponse,
  serverErrorResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import {
  getRateLimitStatus,
  recordRateLimitFailure,
  resetRateLimit,
} from "@/lib/rate-limiter";
import { loginUser } from "@/lib/auth-service";
import { setRefreshTokenCookie } from "@/lib/auth-cookies";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return invalidJsonResponse();
    }

    const parsedBody = loginSchema.safeParse(body);

    if (!parsedBody.success) {
      return validationErrorResponse(parsedBody.error);
    }

    const email = parsedBody.data.email;
    const rateLimit = getRateLimitStatus(request, "login", email);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "RATE_LIMIT_EXCEEDED",
          message: "Muitas tentativas de login. Tente novamente mais tarde.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter ?? 900),
          },
        },
      );
    }

    const result = await loginUser(parsedBody.data);

    if (result.isErr()) {
      recordRateLimitFailure(request, "login", email);
      return domainErrorResponse(result.error);
    }

    resetRateLimit(request, "login", email);

    const { refreshToken, ...responseBody } = result.value;
    const response = NextResponse.json(responseBody);
    setRefreshTokenCookie(response, refreshToken);

    return response;
  } catch (error) {
    console.error("POST /api/auth/login failed", error);
    return serverErrorResponse();
  }
}
