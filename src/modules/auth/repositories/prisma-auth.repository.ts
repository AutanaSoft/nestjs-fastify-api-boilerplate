import { PrismaService } from '@modules/database/services/prisma.service';
import { Injectable } from '@nestjs/common';
import type {
  AuthRefreshTokenDbEntity,
  AuthSessionDbEntity,
  UserDbEntity,
} from '@/modules/database/prisma/generated/client';
import type { CreateAuthUserInput } from '../interfaces';
import { AuthRepository } from './auth.repository';

@Injectable()
export class PrismaAuthRepository extends AuthRepository {
  constructor(private readonly _prismaService: PrismaService) {
    super();
  }

  async createUser(payload: CreateAuthUserInput): Promise<UserDbEntity> {
    return this._prismaService.userDbEntity.create({
      data: payload,
    });
  }

  async findUserById(id: string): Promise<UserDbEntity | null> {
    return this._prismaService.userDbEntity.findUnique({
      where: { id },
    });
  }

  async findUserByEmail(email: string): Promise<UserDbEntity | null> {
    return this._prismaService.userDbEntity.findUnique({
      where: { email },
    });
  }

  async findUserByUserName(userName: string): Promise<UserDbEntity | null> {
    return this._prismaService.userDbEntity.findUnique({
      where: { userName },
    });
  }

  async findUserByIdentifier(identifier: string): Promise<UserDbEntity | null> {
    const trimmed = identifier.trim();
    const normalizedEmail = trimmed.toLowerCase();

    return this._prismaService.userDbEntity.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { userName: trimmed }],
      },
    });
  }

  async verifyUserEmailById(id: string, verifiedAt: Date): Promise<UserDbEntity> {
    return this._prismaService.userDbEntity.update({
      where: { id },
      data: { emailVerifiedAt: verifiedAt },
    });
  }

  async updateUserPasswordById(id: string, passwordHash: string): Promise<UserDbEntity> {
    return this._prismaService.userDbEntity.update({
      where: { id },
      data: { password: passwordHash },
    });
  }

  async createSession(userId: string): Promise<AuthSessionDbEntity> {
    return this._prismaService.authSessionDbEntity.create({
      data: {
        userId,
      },
    });
  }

  async findSessionById(id: string): Promise<AuthSessionDbEntity | null> {
    return this._prismaService.authSessionDbEntity.findUnique({
      where: { id },
    });
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

  async createRefreshToken(payload: {
    sessionId: string;
    tokenHash: string;
    expiresAt: Date;
    rotatedFromId?: string;
  }): Promise<AuthRefreshTokenDbEntity> {
    return this._prismaService.authRefreshTokenDbEntity.create({
      data: {
        sessionId: payload.sessionId,
        tokenHash: payload.tokenHash,
        expiresAt: payload.expiresAt,
        rotatedFromId: payload.rotatedFromId,
      },
    });
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<
    | (AuthRefreshTokenDbEntity & {
        session: AuthSessionDbEntity & {
          user: UserDbEntity;
        };
      })
    | null
  > {
    return this._prismaService.authRefreshTokenDbEntity.findUnique({
      where: { tokenHash },
      include: {
        session: {
          include: {
            user: true,
          },
        },
      },
    });
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
