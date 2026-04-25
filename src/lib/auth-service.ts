import type { Prisma } from "@prisma/client";
import { Role } from "@prisma/client";
import { err, ok, type Result } from "neverthrow";
import { DomainErrors, type DomainError } from "@/domain/errors/domain-errors";
import {
  hashPassword,
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessTokenResult,
  verifyPassword,
  verifyRefreshTokenHash,
  verifyRefreshTokenResult,
} from "@/lib/auth";
import prisma from "@/lib/prisma";
import type {
  LoginResponse,
  OnboardingResponse,
  RefreshTokenResponse,
  SessionUser,
} from "@/types";

const refreshTokenLifetimeMs = 7 * 24 * 60 * 60 * 1000;

export type LoginSessionResponse = LoginResponse & {
  refreshToken: string;
};

export type RefreshSessionResponse = RefreshTokenResponse & {
  refreshToken: string;
};

export type OnboardingSessionResponse = OnboardingResponse & {
  refreshToken: string;
};


const sessionUserSelect = {
  id: true,
  email: true,
  role: true,
  personId: true,
  churchId: true,
  deletedAt: true,
  person: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.UserSelect;

type SessionUserRecord = Prisma.UserGetPayload<{
  select: typeof sessionUserSelect;
}>;

const refreshTokenSelect = {
  id: true,
  tokenId: true,
  tokenHash: true,
  userId: true,
  expiresAt: true,
  user: {
    select: sessionUserSelect,
  },
} satisfies Prisma.RefreshTokenSelect;

function mapSessionUser(user: SessionUserRecord): SessionUser {
  return {
    id: user.id,
    name: user.person.name,
    email: user.email,
    role: user.role,
    personId: user.personId,
    churchId: user.churchId,
  };
}

function buildAccessTokenPayload(user: SessionUserRecord) {
  return {
    sub: user.id,
    email: user.email,
    role: user.role,
    personId: user.personId,
    churchId: user.churchId,
    name: user.person.name,
  };
}

async function createSessionTokens(user: SessionUserRecord) {
  const accessToken = await signAccessToken(buildAccessTokenPayload(user));
  const refreshTokenResult = await signRefreshToken(user.id);
  const tokenHash = await hashRefreshToken(refreshTokenResult.token);

  await prisma.refreshToken.create({
    data: {
      tokenId: refreshTokenResult.tokenId,
      tokenHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + refreshTokenLifetimeMs),
    },
  });

  return {
    accessToken,
    refreshToken: refreshTokenResult.token,
  };
}

function createSessionResponse(
  user: SessionUserRecord,
  tokens: { accessToken: string; refreshToken: string },
): LoginSessionResponse {
  return {
    ...tokens,
    user: mapSessionUser(user),
  };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<
  Result<
    LoginSessionResponse,
    typeof DomainErrors.USER_NOT_FOUND | typeof DomainErrors.INVALID_CREDENTIALS
  >
> {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
    select: {
      ...sessionUserSelect,
      passwordHash: true,
    },
  });

  if (!user || user.deletedAt) {
    return err(DomainErrors.USER_NOT_FOUND);
  }

  const passwordMatches = await verifyPassword(
    input.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    return err(DomainErrors.INVALID_CREDENTIALS);
  }

  const { passwordHash: _, ...userWithoutPassword } = user;
  const tokens = await createSessionTokens(userWithoutPassword);
  return ok(createSessionResponse(userWithoutPassword, tokens));
}

export async function refreshAccessToken(input: {
  refreshToken: string;
}): Promise<
  Result<RefreshSessionResponse, typeof DomainErrors.REFRESH_TOKEN_INVALID>
> {
  const verifiedRefreshToken = await verifyRefreshTokenResult(
    input.refreshToken,
  );

  if (verifiedRefreshToken.isErr()) {
    return err(verifiedRefreshToken.error);
  }

  const { userId, tokenId } = verifiedRefreshToken.value;

  const storedToken = await prisma.refreshToken.findUnique({
    where: {
      tokenId,
    },
    select: refreshTokenSelect,
  });

  if (!storedToken) {
    // Possível reutilização de token já rotacionado/revogado.
    // Revoga as demais sessões do usuário para reduzir o impacto de token roubado.
    await prisma.refreshToken.deleteMany({
      where: {
        userId,
      },
    });

    return err(DomainErrors.REFRESH_TOKEN_INVALID);
  }

  if (storedToken.expiresAt <= new Date() || storedToken.userId !== userId) {
    await prisma.refreshToken.deleteMany({
      where: {
        userId,
      },
    });

    return err(DomainErrors.REFRESH_TOKEN_INVALID);
  }

  const hashMatches = await verifyRefreshTokenHash(
    input.refreshToken,
    storedToken.tokenHash,
  );

  if (!hashMatches) {
    await prisma.refreshToken.deleteMany({
      where: {
        userId,
      },
    });

    return err(DomainErrors.REFRESH_TOKEN_INVALID);
  }

  const accessToken = await signAccessToken(
    buildAccessTokenPayload(storedToken.user),
  );
  const newRefreshTokenResult = await signRefreshToken(storedToken.user.id);
  const newTokenHash = await hashRefreshToken(newRefreshTokenResult.token);

  const rotationResult = await prisma.$transaction(async (transaction) => {
    const deleted = await transaction.refreshToken.deleteMany({
      where: {
        id: storedToken.id,
        tokenId,
        userId,
      },
    });

    if (deleted.count !== 1) {
      await transaction.refreshToken.deleteMany({
        where: {
          userId,
        },
      });

      return false;
    }

    await transaction.refreshToken.create({
      data: {
        tokenId: newRefreshTokenResult.tokenId,
        tokenHash: newTokenHash,
        userId: storedToken.user.id,
        expiresAt: new Date(Date.now() + refreshTokenLifetimeMs),
      },
    });

    return true;
  });

  if (!rotationResult) {
    return err(DomainErrors.REFRESH_TOKEN_INVALID);
  }

  return ok({
    accessToken,
    refreshToken: newRefreshTokenResult.token,
  });
}

export async function logoutUser(input: {
  refreshToken: string;
}): Promise<Result<void, typeof DomainErrors.REFRESH_TOKEN_INVALID>> {
  const verified = await verifyRefreshTokenResult(input.refreshToken);

  if (verified.isErr()) {
    return err(verified.error);
  }

  await prisma.refreshToken.deleteMany({
    where: {
      tokenId: verified.value.tokenId,
    },
  });

  return ok(undefined);
}

export async function getAuthenticatedUser(input: {
  accessToken: string;
}): Promise<
  Result<
    SessionUser,
    typeof DomainErrors.TOKEN_EXPIRED | typeof DomainErrors.TOKEN_INVALID
  >
> {
  const verifiedAccessToken = await verifyAccessTokenResult(input.accessToken);

  if (verifiedAccessToken.isErr()) {
    return err(verifiedAccessToken.error);
  }

  const user = await prisma.user.findUnique({
    where: {
      id: verifiedAccessToken.value.sub,
    },
    select: sessionUserSelect,
  });

  if (!user || user.deletedAt) {
    return err(DomainErrors.TOKEN_INVALID);
  }

  return ok(mapSessionUser(user));
}

export async function onboardChurch(input: {
  churchName: string;
  pastorName: string;
  email: string;
  password: string;
}): Promise<
  Result<
    OnboardingSessionResponse,
    typeof DomainErrors.FORBIDDEN | typeof DomainErrors.EMAIL_ALREADY_EXISTS
  >
> {
  const existingChurches = await prisma.church.count();

  if (existingChurches > 0) {
    return err(DomainErrors.FORBIDDEN);
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    return err(DomainErrors.EMAIL_ALREADY_EXISTS);
  }

  const passwordHash = await hashPassword(input.password);

  const createdSession = await prisma.$transaction(async (transaction) => {
    const church = await transaction.church.create({
      data: {
        name: input.churchName,
      },
    });

    const person = await transaction.person.create({
      data: {
        churchId: church.id,
        name: input.pastorName,
      },
    });

    const user = await transaction.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: Role.pastor,
        personId: person.id,
        churchId: church.id,
      },
      select: sessionUserSelect,
    });

    const accessToken = await signAccessToken(buildAccessTokenPayload(user));
    const refreshTokenResult = await signRefreshToken(user.id);
    const tokenHash = await hashRefreshToken(refreshTokenResult.token);

    await transaction.refreshToken.create({
      data: {
        tokenId: refreshTokenResult.tokenId,
        tokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + refreshTokenLifetimeMs),
      },
    });

    return createSessionResponse(user, {
      accessToken,
      refreshToken: refreshTokenResult.token,
    });
  });

  return ok(createdSession);
}

export type AuthServiceError = DomainError;
