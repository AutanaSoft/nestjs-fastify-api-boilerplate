import authConfig from '@/config/auth.config';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { PinoLogger } from 'nestjs-pino';
import {
  AuthContractValidationError,
  AuthPersistenceNotFoundError,
  AuthPersistenceUnexpectedError,
  AuthPersistenceUniqueConstraintError,
} from '../errors';
import type { AuthSession, UserAuthEntity } from '../interfaces';
import { parseDurationToMs } from '../utils';
import { AuthRepository } from '../repositories';
import { JwtTokenService } from './jwt-token.service';

/**
 * Manages opaque refresh token lifecycle (issue, rotate, revoke).
 */
@Injectable()
export class RefreshTokenService {
  constructor(
    @Inject(authConfig.KEY)
    private readonly _config: ConfigType<typeof authConfig>,
    private readonly _authRepository: AuthRepository,
    private readonly _jwtTokenService: JwtTokenService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(RefreshTokenService.name);
  }

  /**
   * Issues a new auth session and refresh token for a user.
   *
   * @param user Domain user entity.
   * @returns Public auth session with access and refresh tokens.
   * @throws {AuthPersistenceUnexpectedError} For persistence or unexpected failures.
   */
  async issueTokens(user: UserAuthEntity): Promise<AuthSession> {
    try {
      const session = await this._authRepository.createSession(user.id);

      return this.buildSessionTokens({
        user,
        sessionId: session.id,
      });
    } catch (error: unknown) {
      this.rethrowAsPersistenceFailure(error, {
        userId: user.id,
        stage: 'issueTokens',
      });
    }
  }

  /**
   * Rotates an existing refresh token.
   *
   * @param refreshToken Raw refresh token string.
   * @returns New public auth session with rotated tokens.
   * @throws {UnauthorizedException} For invalid/revoked/expired/session-revoked token states.
   * @throws {AuthPersistenceUnexpectedError} For persistence or unexpected failures.
   */
  async rotateTokens(refreshToken: string): Promise<AuthSession> {
    try {
      const tokenHash = this.hashOpaqueToken(refreshToken);
      const record = await this._authRepository.findRefreshTokenByHash(tokenHash);

      if (!record) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (record.revokedAt) {
        // Refresh token reuse protection: revoke whole session family when a revoked token is reused.
        await this.revokeSession(record.sessionId);
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      if (record.expiresAt.getTime() <= Date.now()) {
        await this._authRepository.revokeRefreshTokenById(record.id, new Date());
        throw new UnauthorizedException('Refresh token expired');
      }

      if (record.session.revokedAt) {
        throw new UnauthorizedException('Session is no longer valid');
      }

      await this._authRepository.markRefreshTokenAsUsed(record.id, new Date());
      await this._authRepository.revokeRefreshTokenById(record.id, new Date());

      return this.buildSessionTokens({
        user: record.session.user,
        sessionId: record.sessionId,
        rotatedFromId: record.id,
      });
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.rethrowAsPersistenceFailure(error, { stage: 'rotateTokens' });
    }
  }

  /**
   * Revokes an auth session and all its refresh tokens.
   *
   * @param sessionId Auth session identifier.
   * @returns `void`.
   * @throws {AuthPersistenceUnexpectedError} For persistence or unexpected failures.
   */
  async revokeSession(sessionId: string): Promise<void> {
    try {
      const now = new Date();
      await this._authRepository.revokeSessionById(sessionId, now);
      await this._authRepository.revokeRefreshTokensBySessionId(sessionId, now);
    } catch (error: unknown) {
      this.rethrowAsPersistenceFailure(error, {
        sessionId,
        stage: 'revokeSession',
      });
    }
  }

  private async buildSessionTokens(payload: {
    user: UserAuthEntity;
    sessionId: string;
    rotatedFromId?: string;
  }): Promise<AuthSession> {
    const signedAccessToken = await this._jwtTokenService.signAccessToken({
      sub: payload.user.id,
      email: payload.user.email,
      userName: payload.user.userName,
      role: payload.user.role,
      status: payload.user.status,
      sessionId: payload.sessionId,
    });

    const rawRefreshToken = this.generateOpaqueToken();
    const refreshTokenHash = this.hashOpaqueToken(rawRefreshToken);
    const refreshTokenTtlMs = parseDurationToMs(this._config.AUTH_REFRESH_TOKEN_TTL);

    await this._authRepository.createRefreshToken({
      sessionId: payload.sessionId,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + refreshTokenTtlMs),
      rotatedFromId: payload.rotatedFromId,
    });

    return {
      createdAt: signedAccessToken.createdAt.toISOString(),
      expiredAt: signedAccessToken.expiresAt.toISOString(),
      accessToken: signedAccessToken.token,
      refreshToken: rawRefreshToken,
    };
  }

  private rethrowAsPersistenceFailure(
    error: unknown,
    context: { stage: string; userId?: string; sessionId?: string },
  ): never {
    if (
      error instanceof AuthContractValidationError ||
      error instanceof AuthPersistenceUnexpectedError ||
      error instanceof AuthPersistenceNotFoundError ||
      error instanceof AuthPersistenceUniqueConstraintError
    ) {
      this._logger.error({ error, ...context }, 'Refresh token persistence stage failed');
      throw error;
    }

    if (error instanceof Error) {
      this._logger.error({ error, ...context }, 'Refresh token stage failed unexpectedly');
      throw new AuthPersistenceUnexpectedError('Unexpected refresh token persistence error', error);
    }

    throw error;
  }

  private generateOpaqueToken(): string {
    return randomBytes(48).toString('base64url');
  }

  private hashOpaqueToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
