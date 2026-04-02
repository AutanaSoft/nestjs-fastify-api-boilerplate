import authConfig from '@/config/auth.config';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { parseDurationToMs } from '../utils';
import { AuthRepository } from '../repositories';
import type { AuthSession, UserAuthEntity } from '../interfaces';
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
  ) {}

  async issueTokens(user: UserAuthEntity): Promise<AuthSession> {
    const session = await this._authRepository.createSession(user.id);
    return this.buildSessionTokens({
      user,
      sessionId: session.id,
    });
  }

  async rotateTokens(refreshToken: string): Promise<AuthSession> {
    const tokenHash = this.hashOpaqueToken(refreshToken);
    const record = await this._authRepository.findRefreshTokenByHash(tokenHash);

    if (!record) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (record.revokedAt) {
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
  }

  async revokeSession(sessionId: string): Promise<void> {
    const now = new Date();
    await this._authRepository.revokeSessionById(sessionId, now);
    await this._authRepository.revokeRefreshTokensBySessionId(sessionId, now);
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

  private generateOpaqueToken(): string {
    return randomBytes(48).toString('base64url');
  }

  private hashOpaqueToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
