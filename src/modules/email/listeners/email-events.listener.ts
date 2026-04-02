import {
  AuthEmailVerifiedEvent,
  AuthPasswordResetEvent,
  AuthPasswordResetRequestedEvent,
  AuthUserRegisteredEvent,
} from '@modules/auth/events';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENT_NAMES } from '@shared/constants/event-names.constants';
import { ForgotPasswordEmailService } from '../services/auth/forgot-password-email.service';
import { VerifyEmailService } from '../services/auth/verify-email.service';
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
    private readonly _verifyEmailService: VerifyEmailService,
    private readonly _welcomeEmailService: WelcomeEmailService,
    private readonly _forgotPasswordEmailService: ForgotPasswordEmailService,
    private readonly _passwordChangedEmailService: PasswordChangedEmailService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(EmailEventsListener.name);
  }

  /**
   * Handles user registration and sends verification email.
   *
   * @param {AuthUserRegisteredEvent} event Auth registration event payload.
   */
  @OnEvent(EVENT_NAMES.AUTH.USER_REGISTERED, { async: true })
  async handleUserRegistered(event: AuthUserRegisteredEvent): Promise<void> {
    const { email, userName, token } = event.payload;
    const payload = { to: email, name: userName };

    try {
      await this._verifyEmailService.sendVerifyEmail({ ...payload, token });
      this._logger.info({ email }, 'Verification email sent successfully.');
    } catch (error: unknown) {
      if (error instanceof Error) {
        this._logger.error(
          { email, error: { name: error.name, message: error.message, stack: error.stack } },
          'Failed to process auth user registered email event',
        );
      } else {
        this._logger.error({ email, error }, 'Failed to process auth user registered email event');
      }
    }
  }

  /**
   * Handles successful email verification and sends welcome email.
   *
   * @param {AuthEmailVerifiedEvent} event Auth verified email event.
   */
  @OnEvent(EVENT_NAMES.AUTH.EMAIL_VERIFIED, { async: true })
  async handleEmailVerified(event: AuthEmailVerifiedEvent): Promise<void> {
    const { email, userName } = event.payload;

    try {
      await this._welcomeEmailService.sendWelcomeEmail({
        to: email,
        name: userName,
      });
      this._logger.info({ email }, 'Welcome email sent successfully.');
    } catch (error: unknown) {
      if (error instanceof Error) {
        this._logger.error(
          { email, error: { name: error.name, message: error.message, stack: error.stack } },
          'Failed to process auth email verified event',
        );
      } else {
        this._logger.error({ email, error }, 'Failed to process auth email verified event');
      }
    }
  }

  /**
   * Handles password reset request and sends forgot-password email.
   *
   * @param {AuthPasswordResetRequestedEvent} event Auth reset requested event payload.
   */
  @OnEvent(EVENT_NAMES.AUTH.PASSWORD_RESET_REQUESTED, { async: true })
  async handlePasswordResetRequested(event: AuthPasswordResetRequestedEvent): Promise<void> {
    const { email, userName, token } = event.payload;

    try {
      await this._forgotPasswordEmailService.sendForgotPasswordEmail({
        to: email,
        name: userName,
        token,
      });
      this._logger.info({ email }, 'Password recovery email sent successfully.');
    } catch (error: unknown) {
      if (error instanceof Error) {
        this._logger.error(
          { email, error: { name: error.name, message: error.message, stack: error.stack } },
          'Failed to process auth password reset requested event',
        );
      } else {
        this._logger.error(
          { email, error },
          'Failed to process auth password reset requested event',
        );
      }
    }
  }

  /**
   * Handles successful password reset and sends defensive password changed email.
   *
   * @param {AuthPasswordResetEvent} event Auth password reset event payload.
   */
  @OnEvent(EVENT_NAMES.AUTH.PASSWORD_RESET, { async: true })
  async handlePasswordReset(event: AuthPasswordResetEvent): Promise<void> {
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
          'Failed to process auth password reset event',
        );
      } else {
        this._logger.error({ email, error }, 'Failed to process auth password reset event');
      }
    }
  }
}
