import authConfig from '@/config/auth.config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { ConfigType } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { TokenType } from '../enum';
import type {
  CurrentUser,
  JwtCustomPayload,
  SignAccessTokenInput,
  SignCustomTokenInput,
  SignedAccessToken,
} from '../interfaces';
import { AuthRepository } from '../repositories';
import { JwtCustomPayloadSchema } from '../schemas';
import { JwtAccessPayloadSchema } from '../schemas/jwt.schema';

/**
 * JWT service for access and custom-purpose tokens.
 */
@Injectable()
export class JwtTokenService {
  constructor(
    @Inject(authConfig.KEY)
    private readonly _config: ConfigType<typeof authConfig>,
    private readonly _jwtService: JwtService,
    private readonly _authRepository: AuthRepository,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(JwtTokenService.name);
  }

  /**
   * Signs an access token from validated auth claims.
   *
   * @param payload Access token claims contract.
   * @returns Signed token plus creation and expiration metadata.
   */
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

  /**
   * Signs a custom-purpose token (email verification or password reset).
   *
   * @param payload Custom token input contract.
   * @returns Signed custom token string.
   */
  async signCustomToken(payload: SignCustomTokenInput): Promise<string> {
    const ttl = this.resolveCustomTokenTtl(payload.purpose);

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

  /**
   * Verifies and validates a custom-purpose token payload.
   *
   * @param token Signed token string.
   * @returns Decoded and schema-validated custom token payload.
   * @throws {UnauthorizedException} When token signature/claims are invalid or payload shape is invalid.
   */
  async verifyCustomToken(token: string): Promise<JwtCustomPayload> {
    try {
      const decodedPayload: unknown = await this._jwtService.verifyAsync(token, {
        secret: this._config.AUTH_JWT_SECRET,
        issuer: this._config.AUTH_JWT_ISSUER,
        audience: this._config.AUTH_JWT_AUDIENCE,
      });

      return JwtCustomPayloadSchema.parse(decodedPayload);
    } catch (error: unknown) {
      this._logger.warn({ error }, 'Custom token verification failed');
      throw new UnauthorizedException('Invalid token payload');
    }
  }

  /**
   * Verifies a signed access token and resolves the authenticated user context.
   *
   * @param token Signed access token.
   * @returns Validated current user context bound to a live session.
   * @throws {UnauthorizedException} When token verification fails or the payload/session is invalid.
   */
  async verifyAccessToken(token: string): Promise<CurrentUser> {
    try {
      const decodedPayload: unknown = await this._jwtService.verifyAsync(token, {
        secret: this._config.AUTH_JWT_SECRET,
        issuer: this._config.AUTH_JWT_ISSUER,
        audience: this._config.AUTH_JWT_AUDIENCE,
      });

      return await this.validateAccessPayload(decodedPayload);
    } catch (error: unknown) {
      this._logger.warn({ error }, 'Access token verification failed');
      throw new UnauthorizedException('Invalid access token');
    }
  }

  /**
   * Validates decoded access token claims and resolves the authenticated user context.
   *
   * @param payload Decoded token payload from a trusted JWT verifier.
   * @returns Validated current user context bound to a live session.
   * @throws {UnauthorizedException} When claims or session are invalid.
   */
  async validateAccessPayload(payload: unknown): Promise<CurrentUser> {
    const parsedPayload = JwtAccessPayloadSchema.safeParse(payload);

    if (!parsedPayload.success) {
      throw new UnauthorizedException('Invalid access token payload');
    }

    if (parsedPayload.data.type !== TokenType.ACCESS) {
      throw new UnauthorizedException('Invalid access token');
    }

    const session = await this._authRepository.findSessionById(parsedPayload.data.sessionId);

    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Session is no longer valid');
    }

    return {
      id: parsedPayload.data.sub,
      email: parsedPayload.data.email,
      userName: parsedPayload.data.userName,
      role: parsedPayload.data.role,
      status: parsedPayload.data.status,
      sessionId: parsedPayload.data.sessionId,
    };
  }

  private resolveCustomTokenTtl(purpose: SignCustomTokenInput['purpose']): string {
    if (purpose === TokenType.VERIFY_EMAIL) {
      return this._config.AUTH_VERIFY_EMAIL_TOKEN_TTL;
    }

    return this._config.AUTH_RESET_PASSWORD_TOKEN_TTL;
  }

  private extractExpirationDate(token: string): Date {
    try {
      const payload = this._jwtService.verify<{ exp: number }>(token, {
        secret: this._config.AUTH_JWT_SECRET,
        issuer: this._config.AUTH_JWT_ISSUER,
        audience: this._config.AUTH_JWT_AUDIENCE,
      });

      if (typeof payload.exp !== 'number') {
        throw new UnauthorizedException('Invalid generated token');
      }

      return new Date(payload.exp * 1_000);
    } catch (error: unknown) {
      this._logger.error({ error }, 'Generated access token expiration extraction failed');
      throw new UnauthorizedException('Invalid generated token');
    }
  }
}
