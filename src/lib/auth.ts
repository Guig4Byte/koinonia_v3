import { err, ok, type Result } from "neverthrow"
import { SignJWT, errors as joseErrors, jwtVerify } from "jose"
import { DomainErrors } from "@/domain/errors/domain-errors"

const textEncoder = new TextEncoder()

export interface TokenPayload {
  sub: string
  email: string
  role: string
  personId: string
  churchId: string
  [key: string]: unknown
}

type AccessTokenError =
  | typeof DomainErrors.TOKEN_EXPIRED
  | typeof DomainErrors.TOKEN_INVALID

type RefreshTokenError = typeof DomainErrors.REFRESH_TOKEN_INVALID

type JwtSecretName = "JWT_SECRET" | "JWT_REFRESH_SECRET"

const getJwtSecret = (name: JwtSecretName) => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not configured.`)
  }
  return textEncoder.encode(value)
}

const getBcrypt = () => import("bcryptjs")

export function extractBearerToken(authorizationHeader: string | null) {
  if (!authorizationHeader) {
    return null
  }
  const [scheme, token] = authorizationHeader.split(" ")
  if (scheme !== "Bearer" || !token) {
    return null
  }
  return token
}

export async function hashPassword(password: string): Promise<string> {
  const { hash } = await getBcrypt()
  return hash(password, 12)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  const { compare } = await getBcrypt()
  return compare(password, hashedPassword)
}

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getJwtSecret("JWT_SECRET"))
}

export async function verifyAccessTokenResult(
  token: string,
): Promise<Result<TokenPayload, AccessTokenError>> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret("JWT_SECRET"), {
      clockTolerance: 60,
    })
    return ok(payload as unknown as TokenPayload)
  } catch (error) {
    if (error instanceof joseErrors.JWTExpired) {
      return err(DomainErrors.TOKEN_EXPIRED)
    }
    return err(DomainErrors.TOKEN_INVALID)
  }
}

export async function verifyAccessToken(
  token: string,
): Promise<TokenPayload | null> {
  const result = await verifyAccessTokenResult(token)
  return result.isOk() ? result.value : null
}

export async function verifyAccessTokenDetailed(
  token: string,
): Promise<{ valid: true; payload: TokenPayload } | { valid: false; reason: string }> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret("JWT_SECRET"), {
      clockTolerance: 60,
    })
    return { valid: true, payload: payload as unknown as TokenPayload }
  } catch (error) {
    const reason =
      error instanceof joseErrors.JWTExpired
        ? "Token expirado"
        : "Token inválido"
    return { valid: false, reason }
  }
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret("JWT_REFRESH_SECRET"))
}

export async function verifyRefreshTokenResult(
  token: string,
): Promise<Result<string, RefreshTokenError>> {
  try {
    const { payload } = await jwtVerify(
      token,
      getJwtSecret("JWT_REFRESH_SECRET"),
      {
        clockTolerance: 60,
      },
    )
    if (!payload.sub) {
      return err(DomainErrors.REFRESH_TOKEN_INVALID)
    }
    return ok(payload.sub)
  } catch {
    return err(DomainErrors.REFRESH_TOKEN_INVALID)
  }
}

export async function verifyRefreshToken(
  token: string,
): Promise<string | null> {
  const result = await verifyRefreshTokenResult(token)
  return result.isOk() ? result.value : null
}