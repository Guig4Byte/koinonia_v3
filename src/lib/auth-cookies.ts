import type { NextResponse } from "next/server";

export const REFRESH_TOKEN_COOKIE = "koinonia.refresh-token";
export const SESSION_MARKER_COOKIE = "koinonia.session";

const refreshTokenMaxAgeSeconds = 7 * 24 * 60 * 60;
const sessionMarkerMaxAgeSeconds = refreshTokenMaxAgeSeconds;

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function cookieBaseOptions() {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax" as const,
    path: "/",
  };
}

export function setRefreshTokenCookie(response: NextResponse, refreshToken: string) {
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...cookieBaseOptions(),
    maxAge: refreshTokenMaxAgeSeconds,
  });

  // Cookie não sensível, legível apenas como presença de sessão.
  // O frontend usa isso para saber se deve tentar renovar a sessão após reload,
  // sem expor access/refresh token em localStorage.
  response.cookies.set(SESSION_MARKER_COOKIE, "1", {
    httpOnly: false,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: sessionMarkerMaxAgeSeconds,
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    ...cookieBaseOptions(),
    maxAge: 0,
  });

  response.cookies.set(SESSION_MARKER_COOKIE, "", {
    httpOnly: false,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function parseCookieHeader(cookieHeader: string | null) {
  const cookies = new Map<string, string>();

  if (!cookieHeader) {
    return cookies;
  }

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");

    if (!rawName) {
      continue;
    }

    cookies.set(rawName, decodeURIComponent(rawValue.join("=")));
  }

  return cookies;
}

export function getRefreshTokenFromRequest(request: Request) {
  return parseCookieHeader(request.headers.get("cookie")).get(REFRESH_TOKEN_COOKIE) ?? null;
}
