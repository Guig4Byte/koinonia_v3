// @vitest-environment node

import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimit } from "./rate-limiter";

function createMockRequest(ip: string): Request {
  return new Request("http://localhost/api/auth/login", {
    headers: {
      "x-forwarded-for": ip,
    },
  });
}

describe("checkRateLimit", () => {
  beforeEach(() => {
    // Limpar rate limit entre testes
    resetRateLimit(createMockRequest("192.168.1.1"), "login");
    resetRateLimit(createMockRequest("10.0.0.1"), "login");
  });

  it("permite a primeira tentativa", () => {
    const request = createMockRequest("192.168.1.1");
    const result = checkRateLimit(request, "login");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("permite até 5 tentativas", () => {
    const request = createMockRequest("192.168.1.1");

    for (let i = 0; i < 4; i++) {
      const result = checkRateLimit(request, "login");
      expect(result.allowed).toBe(true);
    }

    const lastAllowed = checkRateLimit(request, "login");
    expect(lastAllowed.allowed).toBe(true);
    expect(lastAllowed.remaining).toBe(0);
  });

  it("bloqueia após 5 tentativas", () => {
    const request = createMockRequest("192.168.1.1");

    for (let i = 0; i < 5; i++) {
      checkRateLimit(request, "login");
    }

    const blocked = checkRateLimit(request, "login");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("IPs diferentes têm limites independentes", () => {
    const request1 = createMockRequest("192.168.1.1");
    const request2 = createMockRequest("10.0.0.1");

    for (let i = 0; i < 5; i++) {
      checkRateLimit(request1, "login");
    }

    const blocked1 = checkRateLimit(request1, "login");
    expect(blocked1.allowed).toBe(false);

    const allowed2 = checkRateLimit(request2, "login");
    expect(allowed2.allowed).toBe(true);
  });
});
