import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { extractBearerToken, verifyAccessTokenResult } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const accessToken = extractBearerToken(request.headers.get("authorization"));

  if (!accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const verifiedAccessToken = await verifyAccessTokenResult(accessToken);

  if (verifiedAccessToken.isErr()) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-koinonia-user-id", verifiedAccessToken.value.sub);
  requestHeaders.set("x-koinonia-user-email", verifiedAccessToken.value.email);
  requestHeaders.set("x-koinonia-user-role", verifiedAccessToken.value.role);
  requestHeaders.set("x-koinonia-person-id", verifiedAccessToken.value.personId);
  requestHeaders.set("x-koinonia-church-id", verifiedAccessToken.value.churchId);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/api/:path*"],
};
