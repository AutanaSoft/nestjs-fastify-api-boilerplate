import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PasswordHashService } from '@modules/security/services';
import { AuthRepository } from '../repositories';
import { USER_ROLES, USER_STATUSES, UserAuthEntitySchema } from '../schemas';
import type { AuthSession, SignUpInput, UserAuthEntity } from '../interfaces';
import { RefreshTokenService } from './refresh-token.service';
import { JwtTokenService } from './jwt-token.service';
import { TokenType } from '../enum';
import { AuthEventsService } from './auth-events.service';
import { PinoLogger } from 'nestjs-pino';

/**
 * Handles auth sign-up flow.
 */
@Injectable()
export class AuthSignUpService {
  constructor(
    private readonly _authRepository: AuthRepository,
    private readonly _passwordHashService: PasswordHashService,
    private readonly _refreshTokenService: RefreshTokenService,
    private readonly _jwtTokenService: JwtTokenService,
    private readonly _authEventsService: AuthEventsService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(AuthSignUpService.name);
  }

  async signUp(payload: SignUpInput): Promise<AuthSession> {
    const [existingByEmail, existingByUserName] = await Promise.all([
      this._authRepository.findUserByEmail(payload.email),
      this._authRepository.findUserByUserName(payload.userName),
    ]);

    if (existingByEmail || existingByUserName) {
      throw new ConflictException('Email or userName is already in use');
    }

    const passwordHash = await this._passwordHashService.hashPassword(payload.password);

    const createdUser: UserAuthEntity = await this._authRepository.createUser({
      email: payload.email,
      userName: payload.userName,
      password: passwordHash,
      role: USER_ROLES.USER,
      status: USER_STATUSES.REGISTERED,
    });

    const parsedUser = UserAuthEntitySchema.safeParse(createdUser);

    if (!parsedUser.success) {
      this._logger.error(
        { error: parsedUser.error, userId: createdUser.id },
        'Created auth user failed schema validation',
      );
      throw new InternalServerErrorException('Internal server error');
    }

    const session = await this._refreshTokenService.issueTokens(parsedUser.data);
    const verifyToken = await this._jwtTokenService.signCustomToken({
      userId: parsedUser.data.id,
      email: parsedUser.data.email,
      userName: parsedUser.data.userName,
      purpose: TokenType.VERIFY_EMAIL,
    });

    this._authEventsService.emitUserRegistered({
      email: parsedUser.data.email,
      userName: parsedUser.data.userName,
      token: verifyToken,
    });

    return session;
  }
}
