import type { UserEventPayload } from '@modules/users/interfaces';
import { Injectable } from '@nestjs/common';
import { EVENT_NAMES } from '@shared/constants/event-names.constants';
import { PinoLogger } from 'nestjs-pino';
import { TokenType } from '../enum';
import { AuthRepository } from '../repositories';
import { EmailTokenPayloadSchema, SignCustomTokenInputSchema } from '../schemas';
import { AuthEventsService } from './auth-events.service';
import { JwtTokenService } from './jwt-token.service';

/**
 * Orchestrates auth-side verification token generation for users created outside auth sign-up.
 */
@Injectable()
export class AuthUserCreatedVerificationService {
  constructor(
    private readonly _authRepository: AuthRepository,
    private readonly _jwtTokenService: JwtTokenService,
    private readonly _authEventsService: AuthEventsService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(AuthUserCreatedVerificationService.name);
  }

  /**
   * Generates and emits the tokenized auth event for verification email delivery.
   *
   * @param {UserEventPayload} payload Validated users-event payload.
   * @returns {Promise<void>} Resolves after auth event emission or safe skip.
   */
  async processUserCreated(payload: UserEventPayload): Promise<void> {
    try {
      const user = await this._authRepository.findUserById(payload.id);

      if (!user) {
        this._logger.warn(
          { eventName: EVENT_NAMES.USER.CREATED, userId: payload.id },
          'Skipping verification token emission: auth user not found',
        );
        return;
      }

      if (user.emailVerifiedAt) {
        this._logger.info(
          { eventName: EVENT_NAMES.USER.CREATED, userId: user.id },
          'Skipping verification token emission: user is already verified',
        );
        return;
      }

      // Security ownership stays in auth: only auth generates verification tokens.
      const customTokenInput = SignCustomTokenInputSchema.parse({
        ...user,
        userId: user.id,
        purpose: TokenType.VERIFY_EMAIL,
      });
      const verifyToken = await this._jwtTokenService.signCustomToken(customTokenInput);

      const emailPayload = EmailTokenPayloadSchema.parse({
        ...user,
        token: verifyToken,
      });

      this._authEventsService.emitUserRegistered(emailPayload);
    } catch (error: unknown) {
      this._logger.error(
        { eventName: EVENT_NAMES.USER.CREATED, userId: payload.id, error },
        'Failed to orchestrate verification token emission from user-created event',
      );
    }
  }
}
