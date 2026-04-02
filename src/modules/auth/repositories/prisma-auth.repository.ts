import { PrismaService } from '@modules/database/services/prisma.service';
import { InternalServerErrorException, Injectable } from '@nestjs/common';
import { mapPrismaErrorToHttpException } from '@database/errors';
import type {
  AuthRefreshTokenEntity,
  AuthRefreshTokenWithSession,
  AuthSessionEntity,
  CreateAuthUserInput,
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

@Injectable()
export class PrismaAuthRepository extends AuthRepository {
  constructor(private readonly _prismaService: PrismaService) {
    super();
  }

  async createUser(payload: CreateAuthUserInput): Promise<UserAuthEntity> {
    try {
      const createdUser = await this._prismaService.userDbEntity.create({
        data: payload,
      });

      return UserAuthEntitySchema.parse(createdUser);
    } catch (error: unknown) {
      const mappedException = mapPrismaErrorToHttpException(error, {
        uniqueConstraintMessage: 'Email or userName is already in use',
        notFoundMessage: 'Resource not found',
      });

      if (mappedException) {
        throw mappedException;
      }

      throw new InternalServerErrorException('Internal server error');
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
