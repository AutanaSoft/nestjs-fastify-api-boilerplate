import { UserCreatedEvent, UserPasswordUpdatedEvent } from '@modules/users/events/users.events';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENT_NAMES } from '@shared/constants/event-names.constants';
import { PinoLogger } from 'nestjs-pino';
import { PasswordChangedEmailService } from '../services/auth/password-changed-email.service';
import { WelcomeEmailService } from '../services/auth/welcome-email.service';

/**
 * Centralized Domain Event Listener for the Email module.
 *
 * Why this architecture?
 * By listening natively to system domain events (e.g. 'user.created', 'user.updated.password'),
 * this module avoids tight coupling with the users module (ensuring SRP). The Email module is
 * 100% reactive, determining background email flows without requiring imperative
 * commands from other contexts (Fire and Forget).
 */
@Injectable()
export class EmailEventsListener {
  constructor(
    private readonly _welcomeEmailService: WelcomeEmailService,
    private readonly _passwordChangedEmailService: PasswordChangedEmailService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(EmailEventsListener.name);
  }

  /**
   * Handles the successful creation of a new user.
   *
   * @param {UserCreatedEvent} event The domain event containing the new user's payload.
   */
  @OnEvent(EVENT_NAMES.USER.CREATED, { async: true })
  async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    const { email, userName } = event.payload;
    const payload = { to: email, name: userName };

    try {
      await this._welcomeEmailService.sendWelcomeEmail(payload);
      this._logger.info({ email }, 'Welcome email sent successfully.');
    } catch (error: unknown) {
      if (error instanceof Error) {
        this._logger.error(
          { email, error: { name: error.name, message: error.message, stack: error.stack } },
          'Failed to process user created email event',
        );
      } else {
        this._logger.error({ email, error }, 'Failed to process user created email event');
      }
    }
  }

  /**
   * Handles the event when a user successfully updates their password.
   * Dispatches a defensive notification email to the user.
   *
   * @param {UserPasswordUpdatedEvent} event The domain event containing the user's payload.
   */
  @OnEvent(EVENT_NAMES.USER.UPDATED_PASSWORD, { async: true })
  async handleUserUpdatedPassword(event: UserPasswordUpdatedEvent): Promise<void> {
    const { email, userName } = event.payload;

    try {
      await this._passwordChangedEmailService.sendPasswordChangedEmail({
        to: email,
        name: userName,
      });
      this._logger.info({ email }, 'Password changed email sent successfully.');
    } catch (error: unknown) {
      if (error instanceof Error) {
        this._logger.error(
          { email, error: { name: error.name, message: error.message, stack: error.stack } },
          'Failed to process password changed email event',
        );
      } else {
        this._logger.error({ email, error }, 'Failed to process password changed email event');
      }
    }
  }
}
