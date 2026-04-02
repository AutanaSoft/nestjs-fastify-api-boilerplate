import { isKnownPrismaError } from '@database/errors';
import { PrismaService } from '@modules/database/services/prisma.service';
import { Injectable } from '@nestjs/common';
import { ZodError } from 'zod';
import {
  AuthContractValidationError,
  AuthPersistenceNotFoundError,
  AuthPersistenceUnexpectedError,
  AuthPersistenceUniqueConstraintError,
} from '../errors';
import type {
  AuthRefreshTokenEntity,
  AuthRefreshTokenWithSession,
  AuthSessionEntity,
  CreateAuthUserData,
  CreateRefreshTokenInput,
  UserAuthEntity,
} from '../interfaces';
import {
  AuthRefreshTokenEntitySchema,
  AuthRefreshTokenWithSessionSchema,
  AuthSessionEntitySchema,
  UserAuthEntitySchema,
} from '../schemas';
import { AuthRepository } from './auth.repository';

const PRISMA_UNIQUE_CONSTRAINT = 'P2002';
const PRISMA_NOT_FOUND = 'P2025';

@Injectable()
export class PrismaAuthRepository extends AuthRepository {
  constructor(private readonly _prismaService: PrismaService) {
    super();
  }

  /**
   * Persists a new auth user using Prisma and returns the domain-safe entity.
   *
   * @param payload Data contract required to create the user in persistence.
   * @returns Persisted user adapted to the auth domain entity contract.
   * @throws {AuthContractValidationError} When persisted data does not match the schema contract.
   * @throws {AuthPersistenceUniqueConstraintError} When email or userName violates unique constraints.
   * @throws {AuthPersistenceNotFoundError} When Prisma reports missing dependent resources.
   * @throws {AuthPersistenceUnexpectedError} For any non-mapped persistence failure.
   */
  async createUser(payload: CreateAuthUserData): Promise<UserAuthEntity> {
    try {
      const createdUser = await this._prismaService.userDbEntity.create({
        data: payload,
      });

      // Enforce repository output contract before exposing data to the service layer.
      return UserAuthEntitySchema.parse(createdUser);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        throw new AuthContractValidationError('Persisted user contract validation failed', error);
      }

      // Normalize ORM-specific errors into repository-level persistence errors.
      if (isKnownPrismaError(error)) {
        if (error.code === PRISMA_UNIQUE_CONSTRAINT) {
          throw new AuthPersistenceUniqueConstraintError(
            'Email or userName is already in use',
            error,
          );
        }

        if (error.code === PRISMA_NOT_FOUND) {
          throw new AuthPersistenceNotFoundError('Resource not found', error);
        }
      }

      throw new AuthPersistenceUnexpectedError('Unexpected persistence error', error);
    }
  }

  async findUserById(id: string): Promise<UserAuthEntity | null> {
    const foundUser = await this._prismaService.userDbEntity.findUnique({
      where: { id },
    });

    return foundUser ? UserAuthEntitySchema.parse(foundUser) : null;
  }

  async findUserByEmail(email: string): Promise<UserAuthEntity | null> {
    const foundUser = await this._prismaService.userDbEntity.findUnique({
      where: { email },
    });

    return foundUser ? UserAuthEntitySchema.parse(foundUser) : null;
  }

  async findUserByUserName(userName: string): Promise<UserAuthEntity | null> {
    const foundUser = await this._prismaService.userDbEntity.findUnique({
      where: { userName },
    });

    return foundUser ? UserAuthEntitySchema.parse(foundUser) : null;
  }

  async findUserByIdentifier(identifier: string): Promise<UserAuthEntity | null> {
    const trimmed = identifier.trim();
    const normalizedEmail = trimmed.toLowerCase();

    const foundUser = await this._prismaService.userDbEntity.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { userName: trimmed }],
      },
    });

    return foundUser ? UserAuthEntitySchema.parse(foundUser) : null;
  }

  async verifyUserEmailById(id: string, verifiedAt: Date): Promise<UserAuthEntity> {
    const verifiedUser = await this._prismaService.userDbEntity.update({
      where: { id },
      data: { emailVerifiedAt: verifiedAt },
    });

    return UserAuthEntitySchema.parse(verifiedUser);
  }

  async updateUserPasswordById(id: string, passwordHash: string): Promise<UserAuthEntity> {
    const updatedUser = await this._prismaService.userDbEntity.update({
      where: { id },
      data: { password: passwordHash },
    });

    return UserAuthEntitySchema.parse(updatedUser);
  }

  async createSession(userId: string): Promise<AuthSessionEntity> {
    const createdSession = await this._prismaService.authSessionDbEntity.create({
      data: {
        userId,
      },
    });

    return AuthSessionEntitySchema.parse(createdSession);
  }

  async findSessionById(id: string): Promise<AuthSessionEntity | null> {
    const foundSession = await this._prismaService.authSessionDbEntity.findUnique({
      where: { id },
    });

    return foundSession ? AuthSessionEntitySchema.parse(foundSession) : null;
  }

  async revokeSessionById(id: string, revokedAt: Date): Promise<void> {
    await this._prismaService.authSessionDbEntity.updateMany({
      where: {
        id,
        revokedAt: null,
      },
      data: {
        revokedAt,
      },
    });
  }

  async createRefreshToken(payload: CreateRefreshTokenInput): Promise<AuthRefreshTokenEntity> {
    const createdRefreshToken = await this._prismaService.authRefreshTokenDbEntity.create({
      data: {
        sessionId: payload.sessionId,
        tokenHash: payload.tokenHash,
        expiresAt: payload.expiresAt,
        rotatedFromId: payload.rotatedFromId,
      },
    });

    return AuthRefreshTokenEntitySchema.parse(createdRefreshToken);
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<AuthRefreshTokenWithSession | null> {
    const refreshToken = await this._prismaService.authRefreshTokenDbEntity.findUnique({
      where: { tokenHash },
      include: {
        session: {
          include: {
            user: true,
          },
        },
      },
    });

    return refreshToken ? AuthRefreshTokenWithSessionSchema.parse(refreshToken) : null;
  }

  async markRefreshTokenAsUsed(id: string, usedAt: Date): Promise<void> {
    await this._prismaService.authRefreshTokenDbEntity.update({
      where: { id },
      data: { usedAt },
    });
  }

  async revokeRefreshTokenById(id: string, revokedAt: Date): Promise<void> {
    await this._prismaService.authRefreshTokenDbEntity.updateMany({
      where: {
        id,
        revokedAt: null,
      },
      data: {
        revokedAt,
      },
    });
  }

  async revokeRefreshTokensBySessionId(sessionId: string, revokedAt: Date): Promise<void> {
    await this._prismaService.authRefreshTokenDbEntity.updateMany({
      where: {
        sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt,
      },
    });
  }
}
