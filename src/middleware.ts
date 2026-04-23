import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyAccessTokenDetailed } from "@/lib/auth"
import { DomainErrors } from "@/domain/errors/domain-errors"

const PUBLIC_PATHS = ["/login", "/onboarding", "/api/auth"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const authHeader = request.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "") ?? ""

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: DomainErrors.UNAUTHORIZED, message: "Token ausente" },
        { status: 401 }
      )
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const result = await verifyAccessTokenDetailed(token)

  if (!result.valid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: DomainErrors.TOKEN_INVALID, message: result.reason },
        { status: 401 }
      )
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-user-id", result.payload.sub)
  requestHeaders.set("x-user-role", result.payload.role)
  requestHeaders.set("x-person-id", result.payload.personId)
  requestHeaders.set("x-church-id", result.payload.churchId)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|workbox-).*)"],
}
