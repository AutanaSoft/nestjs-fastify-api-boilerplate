import type {
  AuthRefreshTokenDbEntity,
  AuthSessionDbEntity,
  UserDbEntity,
} from '@/modules/database/prisma/generated/client';
import type { CreateAuthUserInput } from '../interfaces';

export abstract class AuthRepository {
  abstract createUser(payload: CreateAuthUserInput): Promise<UserDbEntity>;
  abstract findUserById(id: string): Promise<UserDbEntity | null>;
  abstract findUserByEmail(email: string): Promise<UserDbEntity | null>;
  abstract findUserByUserName(userName: string): Promise<UserDbEntity | null>;
  abstract findUserByIdentifier(identifier: string): Promise<UserDbEntity | null>;
  abstract verifyUserEmailById(id: string, verifiedAt: Date): Promise<UserDbEntity>;
  abstract updateUserPasswordById(id: string, passwordHash: string): Promise<UserDbEntity>;

  abstract createSession(userId: string): Promise<AuthSessionDbEntity>;
  abstract findSessionById(id: string): Promise<AuthSessionDbEntity | null>;
  abstract revokeSessionById(id: string, revokedAt: Date): Promise<void>;

  abstract createRefreshToken(payload: {
    sessionId: string;
    tokenHash: string;
    expiresAt: Date;
    rotatedFromId?: string;
  }): Promise<AuthRefreshTokenDbEntity>;

  abstract findRefreshTokenByHash(tokenHash: string): Promise<
    | (AuthRefreshTokenDbEntity & {
        session: AuthSessionDbEntity & {
          user: UserDbEntity;
        };
      })
    | null
  >;

  abstract markRefreshTokenAsUsed(id: string, usedAt: Date): Promise<void>;
  abstract revokeRefreshTokenById(id: string, revokedAt: Date): Promise<void>;
  abstract revokeRefreshTokensBySessionId(sessionId: string, revokedAt: Date): Promise<void>;
}
