import authConfig from '@/config/auth.config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { ConfigType } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { TokenType } from '../enum';
import type {
  JwtCustomPayload,
  SignAccessTokenInput,
  SignCustomTokenInput,
  SignedAccessToken,
} from '../interfaces';
import { JwtCustomPayloadSchema } from '../schemas';

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

  async signAccessToken(payload: SignAccessTokenInput): Promise<SignedAccessToken> {
    const createdAt = new Date();
    const token = await this._jwtService.signAsync(
      {
        ...payload,
        type: TokenType.ACCESS,
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

  async signCustomToken(payload: SignCustomTokenInput): Promise<string> {
    const ttl =
      payload.purpose === TokenType.VERIFY_EMAIL
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
    const decodedPayload: unknown = await this._jwtService.verifyAsync(token, {
      secret: this._config.AUTH_JWT_SECRET,
      issuer: this._config.AUTH_JWT_ISSUER,
      audience: this._config.AUTH_JWT_AUDIENCE,
    });

    const parsedPayload = JwtCustomPayloadSchema.safeParse(decodedPayload);

    if (!parsedPayload.success) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return parsedPayload.data;
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
