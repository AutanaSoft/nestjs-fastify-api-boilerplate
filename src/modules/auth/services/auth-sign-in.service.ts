import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserStatus } from '@/modules/database/prisma/generated/enums';
import { AuthRepository } from '../repositories';
import {
  UserAuthEntitySchema,
  type AuthSession,
  type SignInInput,
  type UserAuthEntity,
} from '../schemas';
import { PasswordHashService } from './password-hash.service';
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

    const foundUser = user as UserAuthEntity;
    const isPasswordValid = await this._passwordHashService.verifyPassword(
      payload.password,
      foundUser.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (foundUser.status === UserStatus.BANNED || foundUser.status === UserStatus.FROZEN) {
      throw new ForbiddenException('User is not allowed to sign in');
    }

    const parsedUser = UserAuthEntitySchema.safeParse(foundUser);

    if (!parsedUser.success) {
      this._logger.error(
        { error: parsedUser.error, userId: foundUser.id },
        'Sign-in user failed schema validation',
      );
      throw new InternalServerErrorException('Internal server error');
    }

    return this._refreshTokenService.issueTokens(parsedUser.data);
  }
}
