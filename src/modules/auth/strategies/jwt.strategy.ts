import authConfig from '@/config/auth.config';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { CurrentUser } from '../interfaces';
import { TokenType } from '../enum';
import { AuthRepository } from '../repositories';
import { JwtAccessPayloadSchema } from '../schemas';

/**
 * Passport JWT strategy for validating access tokens.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(authConfig.KEY)
    config: ConfigType<typeof authConfig>,
    private readonly _authRepository: AuthRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.AUTH_JWT_SECRET,
      issuer: config.AUTH_JWT_ISSUER,
      audience: config.AUTH_JWT_AUDIENCE,
    });
  }

  async validate(payload: unknown): Promise<CurrentUser> {
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
}
