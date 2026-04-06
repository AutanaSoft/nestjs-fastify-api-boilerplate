import authConfig from '@/config/auth.config';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { CurrentUser } from '../interfaces';
import { JwtTokenService } from '../services';

/**
 * Passport JWT strategy for validating access tokens.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(authConfig.KEY)
    config: ConfigType<typeof authConfig>,
    private readonly _jwtTokenService: JwtTokenService,
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
    return this._jwtTokenService.validateAccessPayload(payload);
  }
}
