import authConfig from '@/config/auth.config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { ConfigType } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthRepository } from '../repositories';
import type { CurrentUser, JwtAccessPayload } from '../interfaces';

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

  async validate(payload: JwtAccessPayload): Promise<CurrentUser> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid access token');
    }

    const session = await this._authRepository.findSessionById(payload.sessionId);

    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Session is no longer valid');
    }

    return {
      id: payload.sub,
      email: payload.email,
      userName: payload.userName,
      role: payload.role,
      status: payload.status,
      sessionId: payload.sessionId,
    };
  }
}
