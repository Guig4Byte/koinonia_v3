// @vitest-environment node

import { describe, it, expect, beforeEach } from "vitest";
import {
  getRateLimitStatus,
  recordRateLimitFailure,
  resetRateLimit,
} from "./rate-limiter";

function createMockRequest(ip: string): Request {
  return new Request("http://localhost/api/auth/login", {
    headers: {
      "x-forwarded-for": ip,
    },
  });
}

describe("login rate limiter", () => {
  beforeEach(() => {
    resetRateLimit(createMockRequest("192.168.1.1"), "login", "ana@koinonia.com");
    resetRateLimit(
      createMockRequest("192.168.1.1"),
      "login",
      "pastor@koinonia.com",
    );
    resetRateLimit(createMockRequest("10.0.0.1"), "login", "ana@koinonia.com");
  });

  it("verifica o limite sem consumir tentativa", () => {
    const request = createMockRequest("192.168.1.1");

    const firstStatus = getRateLimitStatus(request, "login", "ana@koinonia.com");
    const secondStatus = getRateLimitStatus(request, "login", "ana@koinonia.com");

    expect(firstStatus.allowed).toBe(true);
    expect(firstStatus.remaining).toBe(5);
    expect(secondStatus.allowed).toBe(true);
    expect(secondStatus.remaining).toBe(5);
  });

  it("registra somente falhas de login", () => {
    const request = createMockRequest("192.168.1.1");

    const firstFailure = recordRateLimitFailure(
      request,
      "login",
      "ana@koinonia.com",
    );

    expect(firstFailure.allowed).toBe(true);
    expect(firstFailure.remaining).toBe(4);

    const status = getRateLimitStatus(request, "login", "ana@koinonia.com");

    expect(status.allowed).toBe(true);
    expect(status.remaining).toBe(4);
  });

  it("bloqueia após 5 falhas para o mesmo IP e email", () => {
    const request = createMockRequest("192.168.1.1");

    for (let i = 0; i < 5; i++) {
      const result = recordRateLimitFailure(
        request,
        "login",
        "ana@koinonia.com",
      );

      expect(result.allowed).toBe(true);
    }

    const blocked = getRateLimitStatus(request, "login", "ana@koinonia.com");

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("emails diferentes têm limites independentes no mesmo IP", () => {
    const request = createMockRequest("192.168.1.1");

    for (let i = 0; i < 5; i++) {
      recordRateLimitFailure(request, "login", "ana@koinonia.com");
    }

    const anaBlocked = getRateLimitStatus(request, "login", "ana@koinonia.com");
    const pastorAllowed = getRateLimitStatus(
      request,
      "login",
      "pastor@koinonia.com",
    );

    expect(anaBlocked.allowed).toBe(false);
    expect(pastorAllowed.allowed).toBe(true);
  });

  it("o mesmo email em IPs diferentes tem limites independentes", () => {
    const request1 = createMockRequest("192.168.1.1");
    const request2 = createMockRequest("10.0.0.1");

    for (let i = 0; i < 5; i++) {
      recordRateLimitFailure(request1, "login", "ana@koinonia.com");
    }

    const blocked1 = getRateLimitStatus(request1, "login", "ana@koinonia.com");
    const allowed2 = getRateLimitStatus(request2, "login", "ana@koinonia.com");

    expect(blocked1.allowed).toBe(false);
    expect(allowed2.allowed).toBe(true);
  });

  it("resetRateLimit libera o login após sucesso", () => {
    const request = createMockRequest("192.168.1.1");

    for (let i = 0; i < 5; i++) {
      recordRateLimitFailure(request, "login", "ana@koinonia.com");
    }

    expect(getRateLimitStatus(request, "login", "ana@koinonia.com").allowed).toBe(
      false,
    );

    resetRateLimit(request, "login", "ana@koinonia.com");

    expect(getRateLimitStatus(request, "login", "ana@koinonia.com").allowed).toBe(
      true,
    );
  });
});
