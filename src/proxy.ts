import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyAccessTokenDetailed } from "@/lib/auth"
import { DomainErrors } from "@/domain/errors/domain-errors"

const PUBLIC_API_PATHS = ["/api/auth"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Só intercepta rotas de API
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Rotas públicas de auth são liberadas
  if (PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const authHeader = request.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "") ?? ""

  if (!token) {
    return NextResponse.json(
      { success: false, error: DomainErrors.UNAUTHORIZED, message: "Token ausente" },
      { status: 401 }
    )
  }

  const result = await verifyAccessTokenDetailed(token)

  if (!result.valid) {
    return NextResponse.json(
      { success: false, error: DomainErrors.TOKEN_INVALID, message: result.reason },
      { status: 401 }
    )
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-user-id", result.payload.sub)
  requestHeaders.set("x-user-role", result.payload.role)
  requestHeaders.set("x-person-id", result.payload.personId)
  requestHeaders.set("x-church-id", result.payload.churchId)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ["/api/:path*"],
}

// Alias para compatibilidade com imports manuais
export { middleware as proxy }
