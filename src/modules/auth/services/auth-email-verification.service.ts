import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AUTH_TOKEN_PURPOSES } from '../constants';
import { AuthRepository } from '../repositories';
import {
  UserAuthEntitySchema,
  type RequestEmailVerificationInput,
  type VerifyEmailInput,
} from '../schemas';
import { JwtTokenService } from './jwt-token.service';
import { AuthEventsService } from './auth-events.service';
import { PinoLogger } from 'nestjs-pino';

/**
 * Handles email verification flows.
 */
@Injectable()
export class AuthEmailVerificationService {
  constructor(
    private readonly _authRepository: AuthRepository,
    private readonly _jwtTokenService: JwtTokenService,
    private readonly _authEventsService: AuthEventsService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(AuthEmailVerificationService.name);
  }

  async requestVerificationEmail(payload: RequestEmailVerificationInput): Promise<void> {
    const user = await this._authRepository.findUserByEmail(payload.email);

    if (!user || user.emailVerifiedAt) {
      return;
    }

    const verifyToken = await this._jwtTokenService.signCustomToken({
      userId: user.id,
      email: user.email,
      userName: user.userName,
      purpose: AUTH_TOKEN_PURPOSES.VERIFY_EMAIL,
    });

    this._authEventsService.emitUserRegistered({
      email: user.email,
      userName: user.userName,
      token: verifyToken,
    });
  }

  async verifyEmail(payload: VerifyEmailInput): Promise<void> {
    let tokenPayload: Awaited<ReturnType<JwtTokenService['verifyCustomToken']>>;
    try {
      tokenPayload = await this._jwtTokenService.verifyCustomToken(payload.token);
    } catch {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (tokenPayload.purpose !== AUTH_TOKEN_PURPOSES.VERIFY_EMAIL) {
      throw new ConflictException('Token purpose is invalid');
    }

    const user = await this._authRepository.findUserById(tokenPayload.sub);

    if (!user) {
      throw new ConflictException('Invalid verification token');
    }

    if (user.emailVerifiedAt) {
      throw new ConflictException('Email is already verified');
    }

    const verifiedUser = await this._authRepository.verifyUserEmailById(user.id, new Date());
    const parsedUser = UserAuthEntitySchema.safeParse(verifiedUser);

    if (!parsedUser.success) {
      this._logger.error(
        { error: parsedUser.error, userId: verifiedUser.id },
        'Verified user failed schema validation',
      );
      throw new InternalServerErrorException('Internal server error');
    }

    this._authEventsService.emitEmailVerified({
      email: parsedUser.data.email,
      userName: parsedUser.data.userName,
    });
  }
}
