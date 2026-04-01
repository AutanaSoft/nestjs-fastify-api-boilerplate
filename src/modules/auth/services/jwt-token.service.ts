import authConfig from '@/config/auth.config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { ConfigType } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { AUTH_TOKEN_PURPOSES } from '../constants';
import type { JwtAccessPayload, JwtCustomPayload } from '../interfaces';
import type { AuthTokenPurpose } from '../schemas';

export interface SignedAccessToken {
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * JWT service for access and custom-purpose tokens.
 */
@Injectable()
export class JwtTokenService {
  constructor(
    @Inject(authConfig.KEY)
    private readonly _config: ConfigType<typeof authConfig>,
    private readonly _jwtService: JwtService,
  ) {}

  async signAccessToken(payload: Omit<JwtAccessPayload, 'type'>): Promise<SignedAccessToken> {
    const createdAt = new Date();
    const token = await this._jwtService.signAsync(
      {
        ...payload,
        type: 'access' as const,
      },
      {
        secret: this._config.AUTH_JWT_SECRET,
        issuer: this._config.AUTH_JWT_ISSUER,
        audience: this._config.AUTH_JWT_AUDIENCE,
        expiresIn: this._config.AUTH_ACCESS_TOKEN_TTL as never,
      },
    );

    return {
      token,
      createdAt,
      expiresAt: this.extractExpirationDate(token),
    };
  }

  async signCustomToken(payload: {
    userId: string;
    email: string;
    userName: string;
    purpose: AuthTokenPurpose;
  }): Promise<string> {
    const ttl =
      payload.purpose === AUTH_TOKEN_PURPOSES.VERIFY_EMAIL
        ? this._config.AUTH_VERIFY_EMAIL_TOKEN_TTL
        : this._config.AUTH_RESET_PASSWORD_TOKEN_TTL;

    return this._jwtService.signAsync(
      {
        sub: payload.userId,
        email: payload.email,
        userName: payload.userName,
        purpose: payload.purpose,
        type: 'custom' as const,
      },
      {
        secret: this._config.AUTH_JWT_SECRET,
        issuer: this._config.AUTH_JWT_ISSUER,
        audience: this._config.AUTH_JWT_AUDIENCE,
        expiresIn: ttl as never,
      },
    );
  }

  async verifyCustomToken(token: string): Promise<JwtCustomPayload> {
    const payload = await this._jwtService.verifyAsync<JwtCustomPayload>(token, {
      secret: this._config.AUTH_JWT_SECRET,
      issuer: this._config.AUTH_JWT_ISSUER,
      audience: this._config.AUTH_JWT_AUDIENCE,
    });

    if (payload.type !== 'custom') {
      throw new UnauthorizedException('Invalid token type');
    }

    return payload;
  }

  private extractExpirationDate(token: string): Date {
    const payload = this._jwtService.verify<{ exp: number }>(token, {
      secret: this._config.AUTH_JWT_SECRET,
      issuer: this._config.AUTH_JWT_ISSUER,
      audience: this._config.AUTH_JWT_AUDIENCE,
    });

    if (typeof payload.exp !== 'number') {
      throw new UnauthorizedException('Invalid generated token');
    }

    return new Date(payload.exp * 1_000);
  }
}
