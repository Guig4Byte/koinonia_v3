import { err, ok, type Result } from "neverthrow";
import {
  SignJWT,
  errors as joseErrors,
  jwtVerify,
  type JWTPayload,
} from "jose";
import { DomainErrors } from "@/domain/errors/domain-errors";
import type { TokenPayload } from "@/types";

const textEncoder = new TextEncoder();

type AccessTokenError =
  | typeof DomainErrors.TOKEN_EXPIRED
  | typeof DomainErrors.TOKEN_INVALID;

type RefreshTokenError = typeof DomainErrors.REFRESH_TOKEN_INVALID;

type JwtSecretName = "JWT_SECRET" | "JWT_REFRESH_SECRET";

const getJwtSecret = (name: JwtSecretName) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return textEncoder.encode(value);
};

const getBcrypt = () => import("bcryptjs");

export function extractBearerToken(authorizationHeader: string | null) {
  if (!authorizationHeader) {
    return null;
  }
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/);
  if (!match) {
    return null;
  }
  return match[1] ?? null;
}

export async function hashPassword(password: string): Promise<string> {
  const { hash } = await getBcrypt();
  return hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  const { compare } = await getBcrypt();
  return compare(password, hashedPassword);
}

export async function hashRefreshToken(token: string): Promise<string> {
  const { hash } = await getBcrypt();
  return hash(token, 8);
}

export async function verifyRefreshTokenHash(
  token: string,
  hashedToken: string,
): Promise<boolean> {
  const { compare } = await getBcrypt();
  return compare(token, hashedToken);
}

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getJwtSecret("JWT_SECRET"));
}

export async function verifyAccessTokenResult(
  token: string,
): Promise<Result<TokenPayload, AccessTokenError>> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret("JWT_SECRET"), {
      clockTolerance: 60,
    });
    return ok(payload as unknown as TokenPayload);
  } catch (error) {
    if (error instanceof joseErrors.JWTExpired) {
      return err(DomainErrors.TOKEN_EXPIRED);
    }
    return err(DomainErrors.TOKEN_INVALID);
  }
}

export async function verifyAccessToken(
  token: string,
): Promise<TokenPayload | null> {
  const result = await verifyAccessTokenResult(token);
  return result.isOk() ? result.value : null;
}

export async function verifyAccessTokenDetailed(
  token: string,
): Promise<
  { valid: true; payload: TokenPayload } | { valid: false; reason: string }
> {
  const result = await verifyAccessTokenResult(token);

  if (result.isOk()) {
    return { valid: true, payload: result.value };
  }

  const reason =
    result.error === DomainErrors.TOKEN_EXPIRED
      ? "Token expirado"
      : "Token inválido";

  return { valid: false, reason };
}

export interface RefreshTokenResult {
  token: string;
  tokenId: string;
}

export async function signRefreshToken(
  userId: string,
): Promise<RefreshTokenResult> {
  const tokenId = crypto.randomUUID();
  const token = await new SignJWT({ sub: userId, jti: tokenId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setJti(tokenId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret("JWT_REFRESH_SECRET"));

  return { token, tokenId };
}

export interface VerifiedRefreshToken {
  userId: string;
  tokenId: string;
}

export async function verifyRefreshTokenResult(
  token: string,
): Promise<Result<VerifiedRefreshToken, RefreshTokenError>> {
  try {
    const { payload } = await jwtVerify(
      token,
      getJwtSecret("JWT_REFRESH_SECRET"),
      {
        clockTolerance: 60,
      },
    );
    if (!payload.sub || !payload.jti) {
      return err(DomainErrors.REFRESH_TOKEN_INVALID);
    }
    return ok({ userId: payload.sub, tokenId: String(payload.jti) });
  } catch {
    return err(DomainErrors.REFRESH_TOKEN_INVALID);
  }
}

export async function verifyRefreshToken(
  token: string,
): Promise<VerifiedRefreshToken | null> {
  const result = await verifyRefreshTokenResult(token);
  return result.isOk() ? result.value : null;
}
