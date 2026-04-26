interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const RATE_LIMIT_MAX_FAILURES = 5;

const cache = new Map<string, RateLimitEntry>();

// Limpeza periódica de entradas expiradas (a cada 5 minutos)
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now > entry.resetAt) {
        cache.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  const realIp = request.headers.get("x-real-ip");

  if (realIp) {
    return realIp.trim();
  }

  const cloudflareIp = request.headers.get("cf-connecting-ip");

  if (cloudflareIp) {
    return cloudflareIp.trim();
  }

  return "unknown";
}

function normalizeIdentifier(identifier?: string): string {
  const value = identifier?.trim().toLowerCase();

  if (!value) {
    return "anonymous";
  }

  return value;
}

function buildRateLimitKey(
  request: Request,
  keyPrefix: string,
  identifier?: string,
): string {
  const ip = getClientIp(request);
  const normalizedIdentifier = normalizeIdentifier(identifier);

  return `${keyPrefix}:${ip}:${normalizedIdentifier}`;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

function createAllowedResult(entry?: RateLimitEntry): RateLimitResult {
  const now = Date.now();
  const resetAt = entry?.resetAt ?? now + RATE_LIMIT_WINDOW_MS;
  const count = entry?.count ?? 0;

  return {
    allowed: true,
    remaining: Math.max(RATE_LIMIT_MAX_FAILURES - count, 0),
    resetAt,
  };
}

function createBlockedResult(entry: RateLimitEntry): RateLimitResult {
  const now = Date.now();

  return {
    allowed: false,
    remaining: 0,
    resetAt: entry.resetAt,
    retryAfter: Math.max(Math.ceil((entry.resetAt - now) / 1000), 1),
  };
}

export function getRateLimitStatus(
  request: Request,
  keyPrefix = "login",
  identifier?: string,
): RateLimitResult {
  const key = buildRateLimitKey(request, keyPrefix, identifier);
  const now = Date.now();
  const entry = cache.get(key);

  if (!entry) {
    return createAllowedResult();
  }

  if (now > entry.resetAt) {
    cache.delete(key);
    return createAllowedResult();
  }

  if (entry.count >= RATE_LIMIT_MAX_FAILURES) {
    return createBlockedResult(entry);
  }

  return createAllowedResult(entry);
}

export function recordRateLimitFailure(
  request: Request,
  keyPrefix = "login",
  identifier?: string,
): RateLimitResult {
  const key = buildRateLimitKey(request, keyPrefix, identifier);
  const now = Date.now();
  const entry = cache.get(key);

  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    };

    cache.set(key, newEntry);
    return createAllowedResult(newEntry);
  }

  if (entry.count >= RATE_LIMIT_MAX_FAILURES) {
    return createBlockedResult(entry);
  }

  entry.count += 1;
  return createAllowedResult(entry);
}

/**
 * Mantido para compatibilidade com chamadas antigas.
 *
 * A operação incrementa o contador e deve ser usada apenas para falhas.
 * Para verificar se uma requisição já está bloqueada sem consumir tentativa,
 * use getRateLimitStatus.
 */
export function checkRateLimit(
  request: Request,
  keyPrefix = "login",
  identifier?: string,
): RateLimitResult {
  return recordRateLimitFailure(request, keyPrefix, identifier);
}

export function resetRateLimit(
  request: Request,
  keyPrefix = "login",
  identifier?: string,
): void {
  const key = buildRateLimitKey(request, keyPrefix, identifier);
  cache.delete(key);
}
