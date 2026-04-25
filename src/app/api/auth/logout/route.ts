import { NextResponse } from "next/server";
import { serverErrorResponse } from "@/lib/api-response";
import { clearAuthCookies, getRefreshTokenFromRequest } from "@/lib/auth-cookies";
import { logoutUser } from "@/lib/auth-service";

export async function POST(request: Request) {
  try {
    const refreshToken = getRefreshTokenFromRequest(request);

    if (refreshToken) {
      const result = await logoutUser({ refreshToken });

      if (result.isErr()) {
        // Logout deve limpar a sessão local/cookie mesmo quando o token já foi revogado.
        console.warn("POST /api/auth/logout received an invalid refresh token");
      }
    }

    const response = NextResponse.json({ success: true });
    clearAuthCookies(response);

    return response;
  } catch (error) {
    console.error("POST /api/auth/logout failed", error);
    return serverErrorResponse();
  }
}
