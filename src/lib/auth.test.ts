// @vitest-environment node

import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "test-secret-minimo-32-bytes-long!!";
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret-minimo-32-by!!";
  }
});
import type { TokenPayload } from "@/types";
import {
  extractBearerToken,
  hashPassword,
  verifyPassword,
  hashRefreshToken,
  verifyRefreshTokenHash,
  signAccessToken,
  verifyAccessToken,
  verifyAccessTokenResult,
  signRefreshToken,
  verifyRefreshToken,
  verifyRefreshTokenResult,
} from "./auth";
import { DomainErrors } from "@/domain/errors/domain-errors";

describe("extractBearerToken", () => {
  it("retorna o token quando o header é válido", () => {
    expect(extractBearerToken("Bearer abc123")).toBe("abc123");
  });

  it("retorna null quando o header é null", () => {
    expect(extractBearerToken(null)).toBeNull();
  });

  it("retorna null quando o scheme não é Bearer", () => {
    expect(extractBearerToken("Basic abc123")).toBeNull();
  });

  it("retorna null quando não há token após Bearer", () => {
    expect(extractBearerToken("Bearer ")).toBeNull();
  });
});

describe("hashPassword + verifyPassword", () => {
  it("hasheia uma senha e consegue verificar", async () => {
    const password = "minha-senha-segura";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash).toMatch(/^\$2[aby]\$/); // prefixo bcrypt

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it("rejeita uma senha incorreta", async () => {
    const password = "senha-correta";
    const hash = await hashPassword(password);

    const isValid = await verifyPassword("senha-errada", hash);
    expect(isValid).toBe(false);
  });
});

describe("hashRefreshToken + verifyRefreshTokenHash", () => {
  it("hasheia um refresh token e consegue verificar", async () => {
    const token = "refresh-token-exemplo-123";
    const hash = await hashRefreshToken(token);

    expect(hash).not.toBe(token);
    expect(hash).toMatch(/^\$2[aby]\$/);

    const isValid = await verifyRefreshTokenHash(token, hash);
    expect(isValid).toBe(true);
  });

  it("rejeita um refresh token incorreto", async () => {
    const token = "refresh-token-correto";
    const hash = await hashRefreshToken(token);

    const isValid = await verifyRefreshTokenHash("refresh-token-errado", hash);
    expect(isValid).toBe(false);
  });
});

describe("signAccessToken + verifyAccessToken", () => {
  const payload: TokenPayload = {
    sub: "user-123",
    email: "roberto@igreja.org",
    role: "pastor",
    personId: "person-123",
    churchId: "church-123",
    name: "Roberto Silva",
  };

  it("gera um token JWT válido", async () => {
    const token = await signAccessToken(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("verifica e retorna o payload de um token válido", async () => {
    const token = await signAccessToken(payload);
    const verified = await verifyAccessToken(token);

    expect(verified).not.toBeNull();
    expect(verified!.sub).toBe(payload.sub);
    expect(verified!.email).toBe(payload.email);
    expect(verified!.role).toBe(payload.role);
    expect(verified!.personId).toBe(payload.personId);
    expect(verified!.churchId).toBe(payload.churchId);
  });

  it("retorna null para um token inválido", async () => {
    const verified = await verifyAccessToken("token-invalido");
    expect(verified).toBeNull();
  });
});

describe("verifyAccessTokenResult", () => {
  const payload: TokenPayload = {
    sub: "user-123",
    email: "roberto@igreja.org",
    role: "pastor",
    personId: "person-123",
    churchId: "church-123",
    name: "Roberto Silva",
  };

  it("retorna ok para token válido", async () => {
    const token = await signAccessToken(payload);
    const result = await verifyAccessTokenResult(token);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.sub).toBe(payload.sub);
    }
  });

  it("retorna err TOKEN_INVALID para token malformado", async () => {
    const result = await verifyAccessTokenResult("token-malformado");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe(DomainErrors.TOKEN_INVALID);
    }
  });
});

describe("signRefreshToken + verifyRefreshToken", () => {
  it("gera um refresh token válido com tokenId", async () => {
    const result = await signRefreshToken("user-123");
    expect(typeof result.token).toBe("string");
    expect(typeof result.tokenId).toBe("string");
    expect(result.token.split(".")).toHaveLength(3);
  });

  it("verifica e retorna userId e tokenId de um refresh token válido", async () => {
    const result = await signRefreshToken("user-123");
    const verified = await verifyRefreshToken(result.token);

    expect(verified).not.toBeNull();
    expect(verified!.userId).toBe("user-123");
    expect(verified!.tokenId).toBe(result.tokenId);
  });

  it("retorna null para um refresh token inválido", async () => {
    const verified = await verifyRefreshToken("token-invalido");
    expect(verified).toBeNull();
  });
});

describe("verifyRefreshTokenResult", () => {
  it("retorna ok para refresh token válido", async () => {
    const result = await signRefreshToken("user-456");
    const verified = await verifyRefreshTokenResult(result.token);

    expect(verified.isOk()).toBe(true);
    if (verified.isOk()) {
      expect(verified.value.userId).toBe("user-456");
      expect(verified.value.tokenId).toBe(result.tokenId);
    }
  });

  it("retorna err REFRESH_TOKEN_INVALID para token malformado", async () => {
    const result = await verifyRefreshTokenResult("token-malformado");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe(DomainErrors.REFRESH_TOKEN_INVALID);
    }
  });
});
