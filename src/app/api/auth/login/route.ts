import { NextResponse } from "next/server";
import {
  domainErrorResponse,
  invalidJsonResponse,
  serverErrorResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limiter";
import { loginUser } from "@/lib/auth-service";
import { setRefreshTokenCookie } from "@/lib/auth-cookies";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(request, "login");

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

    const result = await loginUser(parsedBody.data);

    if (result.isErr()) {
      return domainErrorResponse(result.error);
    }

    const { refreshToken, ...responseBody } = result.value;
    const response = NextResponse.json(responseBody);
    setRefreshTokenCookie(response, refreshToken);

    return response;
  } catch (error) {
    console.error("POST /api/auth/login failed", error);
    return serverErrorResponse();
  }
}
