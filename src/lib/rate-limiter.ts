interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const RATE_LIMIT_MAX_REQUESTS = 5;

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
  return "unknown";
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export function checkRateLimit(
  request: Request,
  keyPrefix = "login",
): RateLimitResult {
  const ip = getClientIp(request);
  const key = `${keyPrefix}:${ip}`;
  const now = Date.now();

  const entry = cache.get(key);

  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    };
    cache.set(key, newEntry);
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetAt: newEntry.resetAt,
    };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
    resetAt: entry.resetAt,
  };
}

export function resetRateLimit(request: Request, keyPrefix = "login"): void {
  const ip = getClientIp(request);
  const key = `${keyPrefix}:${ip}`;
  cache.delete(key);
}
