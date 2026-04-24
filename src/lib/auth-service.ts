import type { Prisma } from "@prisma/client";
import { Role } from "@prisma/client";
import { err, ok, type Result } from "neverthrow";
import { DomainErrors, type DomainError } from "@/domain/errors/domain-errors";
import {
  hashPassword,
  signAccessToken,
  signRefreshToken,
  verifyAccessTokenResult,
  verifyPassword,
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
  token: true,
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
  const refreshToken = await signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + refreshTokenLifetimeMs),
    },
  });

  return {
    accessToken,
    refreshToken,
  };
}

function createSessionResponse(
  user: SessionUserRecord,
  tokens: { accessToken: string; refreshToken: string },
): LoginResponse {
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
    LoginResponse,
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

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    return err(DomainErrors.INVALID_CREDENTIALS);
  }

  const { passwordHash: _, ...userWithoutPassword } = user;
  const tokens = await createSessionTokens(userWithoutPassword);
  return ok(createSessionResponse(userWithoutPassword, tokens));
}

export async function refreshAccessToken(input: {
  refreshToken: string;
}): Promise<Result<RefreshTokenResponse, typeof DomainErrors.REFRESH_TOKEN_INVALID>> {
  const verifiedRefreshToken = await verifyRefreshTokenResult(input.refreshToken);

  if (verifiedRefreshToken.isErr()) {
    return err(verifiedRefreshToken.error);
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: {
      token: input.refreshToken,
    },
    select: refreshTokenSelect,
  });

  if (!storedToken) {
    return err(DomainErrors.REFRESH_TOKEN_INVALID);
  }

  if (storedToken.expiresAt <= new Date() || storedToken.userId !== verifiedRefreshToken.value) {
    await prisma.refreshToken.delete({
      where: {
        id: storedToken.id,
      },
    });

    return err(DomainErrors.REFRESH_TOKEN_INVALID);
  }

  const accessToken = await signAccessToken(buildAccessTokenPayload(storedToken.user));

  return ok({
    accessToken,
  });
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
    OnboardingResponse,
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
    const refreshToken = await signRefreshToken(user.id);

    await transaction.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + refreshTokenLifetimeMs),
      },
    });

    return createSessionResponse(user, {
      accessToken,
      refreshToken,
    });
  });

  return ok(createdSession);
}

export type AuthServiceError = DomainError;
