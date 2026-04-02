import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PasswordHashService } from '@modules/security/services';
import { AuthRepository } from '../repositories';
import { USER_STATUSES, UserAuthEntitySchema } from '../schemas';
import type { AuthSession, SignInInput } from '../interfaces';
import { RefreshTokenService } from './refresh-token.service';
import { PinoLogger } from 'nestjs-pino';

/**
 * Handles auth sign-in flow.
 */
@Injectable()
export class AuthSignInService {
  constructor(
    private readonly _authRepository: AuthRepository,
    private readonly _passwordHashService: PasswordHashService,
    private readonly _refreshTokenService: RefreshTokenService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(AuthSignInService.name);
  }

  async signIn(payload: SignInInput): Promise<AuthSession> {
    const user = await this._authRepository.findUserByIdentifier(payload.identifier);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this._passwordHashService.verifyPassword(
      payload.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === USER_STATUSES.BANNED || user.status === USER_STATUSES.FROZEN) {
      throw new ForbiddenException('User is not allowed to sign in');
    }

    const parsedUser = UserAuthEntitySchema.safeParse(user);

    if (!parsedUser.success) {
      this._logger.error(
        { error: parsedUser.error, userId: user.id },
        'Sign-in user failed schema validation',
      );
      throw new InternalServerErrorException('Internal server error');
    }

    return this._refreshTokenService.issueTokens(parsedUser.data);
  }
}
