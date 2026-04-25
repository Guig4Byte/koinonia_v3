import { NextResponse } from "next/server";
import {
  domainErrorResponse,
  serverErrorResponse,
} from "@/lib/api-response";
import { clearAuthCookies, getRefreshTokenFromRequest, setRefreshTokenCookie } from "@/lib/auth-cookies";
import { refreshAccessToken } from "@/lib/auth-service";
import { DomainErrors } from "@/domain/errors/domain-errors";

export async function POST(request: Request) {
  try {
    const refreshToken = getRefreshTokenFromRequest(request);

    if (!refreshToken) {
      const response = domainErrorResponse(DomainErrors.REFRESH_TOKEN_INVALID);
      clearAuthCookies(response);
      return response;
    }

    const result = await refreshAccessToken({ refreshToken });

    if (result.isErr()) {
      const response = domainErrorResponse(result.error);
      clearAuthCookies(response);
      return response;
    }

    const { refreshToken: rotatedRefreshToken, ...responseBody } = result.value;
    const response = NextResponse.json(responseBody);
    setRefreshTokenCookie(response, rotatedRefreshToken);

    return response;
  } catch (error) {
    console.error("POST /api/auth/refresh failed", error);
    return serverErrorResponse();
  }
}
