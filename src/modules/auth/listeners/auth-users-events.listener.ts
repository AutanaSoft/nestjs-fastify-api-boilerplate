import { UserCreatedEvent } from '@modules/users/events';
import { UserEventPayloadSchema } from '@modules/users/schemas';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENT_NAMES } from '@shared/constants/event-names.constants';
import { PinoLogger } from 'nestjs-pino';
import { AuthUserCreatedVerificationService } from '../services/auth-user-created-verification.service';

/**
 * Orchestrates verification-token emission when a user is created from the users domain.
 *
 * The auth module owns token generation, so this listener bridges `USER.CREATED`
 * into the existing auth tokenized event contract (`AUTH.USER_REGISTERED`).
 */
@Injectable()
export class AuthUsersEventsListener {
  constructor(
    private readonly _authUserCreatedVerificationService: AuthUserCreatedVerificationService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(AuthUsersEventsListener.name);
  }

  /**
   * Handles users `USER.CREATED` events to trigger verification email orchestration.
   *
   * @param {UserCreatedEvent} event Users domain event payload.
   * @returns {Promise<void>} Resolves when the auth tokenized event is emitted.
   */
  @OnEvent(EVENT_NAMES.USER.CREATED, { async: true })
  async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    const parsedPayload = UserEventPayloadSchema.safeParse(event.payload);

    if (!parsedPayload.success) {
      this._logger.error(
        { eventName: EVENT_NAMES.USER.CREATED, payload: event.payload, error: parsedPayload.error },
        'Received invalid users event payload',
      );
      return;
    }

    await this._authUserCreatedVerificationService.processUserCreated(parsedPayload.data);
  }
}
