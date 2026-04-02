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

/**
 * Prisma-backed implementation of the auth repository contract.
 *
 * This repository is the only auth-module layer that knows Prisma details.
 * All returned records are normalized through Zod schemas before leaving
 * persistence boundaries.
 */
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

  /**
   * Finds an auth user by id.
   *
   * @param id User UUID.
   * @returns User entity when found, otherwise `null`.
   */
  async findUserById(id: string): Promise<UserAuthEntity | null> {
    const foundUser = await this._prismaService.userDbEntity.findUnique({
      where: { id },
    });

    return foundUser ? UserAuthEntitySchema.parse(foundUser) : null;
  }

  /**
   * Finds an auth user by email.
   *
   * @param email Normalized user email.
   * @returns User entity when found, otherwise `null`.
   */
  async findUserByEmail(email: string): Promise<UserAuthEntity | null> {
    const foundUser = await this._prismaService.userDbEntity.findUnique({
      where: { email },
    });

    return foundUser ? UserAuthEntitySchema.parse(foundUser) : null;
  }

  /**
   * Finds an auth user by user name.
   *
   * @param userName User public handle.
   * @returns User entity when found, otherwise `null`.
   */
  async findUserByUserName(userName: string): Promise<UserAuthEntity | null> {
    const foundUser = await this._prismaService.userDbEntity.findUnique({
      where: { userName },
    });

    return foundUser ? UserAuthEntitySchema.parse(foundUser) : null;
  }

  /**
   * Marks user email as verified.
   *
   * @param id User UUID.
   * @param verifiedAt Verification timestamp.
   * @returns Updated user entity.
   */
  async verifyUserEmailById(id: string, verifiedAt: Date): Promise<UserAuthEntity> {
    const verifiedUser = await this._prismaService.userDbEntity.update({
      where: { id },
      data: { emailVerifiedAt: verifiedAt },
    });

    return UserAuthEntitySchema.parse(verifiedUser);
  }

  /**
   * Updates user password hash.
   *
   * @param id User UUID.
   * @param passwordHash Pre-hashed password.
   * @returns Updated user entity.
   */
  async updateUserPasswordById(id: string, passwordHash: string): Promise<UserAuthEntity> {
    const updatedUser = await this._prismaService.userDbEntity.update({
      where: { id },
      data: { password: passwordHash },
    });

    return UserAuthEntitySchema.parse(updatedUser);
  }

  /**
   * Creates a new auth session for a user.
   *
   * @param userId User UUID.
   * @returns Created session entity.
   */
  async createSession(userId: string): Promise<AuthSessionEntity> {
    const createdSession = await this._prismaService.authSessionDbEntity.create({
      data: {
        userId,
      },
    });

    return AuthSessionEntitySchema.parse(createdSession);
  }

  /**
   * Finds an auth session by identifier.
   *
   * @param id Session UUID.
   * @returns Session entity when found, otherwise `null`.
   */
  async findSessionById(id: string): Promise<AuthSessionEntity | null> {
    const foundSession = await this._prismaService.authSessionDbEntity.findUnique({
      where: { id },
    });

    return foundSession ? AuthSessionEntitySchema.parse(foundSession) : null;
  }

  /**
   * Revokes a session if it is still active.
   *
   * @param id Session UUID.
   * @param revokedAt Revocation timestamp.
   * @returns `void`.
   */
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

  /**
   * Persists a refresh token record.
   *
   * @param payload Refresh token persistence contract.
   * @returns Created refresh token entity.
   */
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

  /**
   * Finds a refresh token by token hash including session and user relations.
   *
   * @param tokenHash SHA-256 token hash.
   * @returns Refresh token aggregate when found, otherwise `null`.
   */
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

  /**
   * Marks a refresh token as used.
   *
   * @param id Refresh token UUID.
   * @param usedAt Usage timestamp.
   * @returns `void`.
   */
  async markRefreshTokenAsUsed(id: string, usedAt: Date): Promise<void> {
    await this._prismaService.authRefreshTokenDbEntity.update({
      where: { id },
      data: { usedAt },
    });
  }

  /**
   * Revokes a single refresh token when still active.
   *
   * @param id Refresh token UUID.
   * @param revokedAt Revocation timestamp.
   * @returns `void`.
   */
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

  /**
   * Revokes all active refresh tokens for a session.
   *
   * @param sessionId Session UUID.
   * @param revokedAt Revocation timestamp.
   * @returns `void`.
   */
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
