import type {
  AuthRefreshTokenEntity,
  AuthRefreshTokenWithSession,
  AuthSessionEntity,
  CreateAuthUserInput,
  CreateRefreshTokenInput,
  UserAuthEntity,
} from '../interfaces';

export abstract class AuthRepository {
  abstract createUser(payload: CreateAuthUserInput): Promise<UserAuthEntity>;
  abstract findUserById(id: string): Promise<UserAuthEntity | null>;
  abstract findUserByEmail(email: string): Promise<UserAuthEntity | null>;
  abstract findUserByUserName(userName: string): Promise<UserAuthEntity | null>;
  abstract findUserByIdentifier(identifier: string): Promise<UserAuthEntity | null>;
  abstract verifyUserEmailById(id: string, verifiedAt: Date): Promise<UserAuthEntity>;
  abstract updateUserPasswordById(id: string, passwordHash: string): Promise<UserAuthEntity>;

  abstract createSession(userId: string): Promise<AuthSessionEntity>;
  abstract findSessionById(id: string): Promise<AuthSessionEntity | null>;
  abstract revokeSessionById(id: string, revokedAt: Date): Promise<void>;

  abstract createRefreshToken(payload: CreateRefreshTokenInput): Promise<AuthRefreshTokenEntity>;

  abstract findRefreshTokenByHash(tokenHash: string): Promise<AuthRefreshTokenWithSession | null>;

  abstract markRefreshTokenAsUsed(id: string, usedAt: Date): Promise<void>;
  abstract revokeRefreshTokenById(id: string, revokedAt: Date): Promise<void>;
  abstract revokeRefreshTokensBySessionId(sessionId: string, revokedAt: Date): Promise<void>;
}
