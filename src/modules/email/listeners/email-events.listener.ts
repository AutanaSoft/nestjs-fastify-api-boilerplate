import {
  AuthEmailVerifiedEvent,
  AuthPasswordResetEvent,
  AuthPasswordResetRequestedEvent,
  AuthUserRegisteredEvent,
} from '@modules/auth/events';
import type { EmailPayload, EmailTokenPayload } from '@modules/auth/interfaces';
import { EmailPayloadSchema, EmailTokenPayloadSchema } from '@modules/auth/schemas';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENT_NAMES } from '@shared/constants/event-names.constants';
import { PinoLogger } from 'nestjs-pino';
import { EmailForgotPasswordService } from '../services/auth/email-forgot-password.service';
import { EmailPasswordChangedService } from '../services/auth/email-password-changed.service';
import { EmailVerifyService } from '../services/auth/email-verify.service';
import { EmailWelcomeService } from '../services/auth/email-welcome.service';

/**
 * Centralized Domain Event Listener for the Email module.
 *
 * Why this architecture?
 * By listening natively to auth tokenized events, this module avoids coupling
 * to token orchestration concerns from other bounded contexts.
 */
@Injectable()
export class EmailEventsListener {
  constructor(
    private readonly _verifyEmailService: EmailVerifyService,
    private readonly _welcomeEmailService: EmailWelcomeService,
    private readonly _forgotPasswordEmailService: EmailForgotPasswordService,
    private readonly _passwordChangedEmailService: EmailPasswordChangedService,
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
    const authPayload = this._parseEmailTokenPayload(
      event.payload,
      EVENT_NAMES.AUTH.USER_REGISTERED,
    );

    if (!authPayload) {
      return;
    }

    const { email, userName, token } = authPayload;
    const payload = { to: email, name: userName };

    await this._verifyEmailService.sendVerifyEmail({ ...payload, token });
  }

  /**
   * Handles successful email verification and sends welcome email.
   *
   * @param {AuthEmailVerifiedEvent} event Auth verified email event.
   */
  @OnEvent(EVENT_NAMES.AUTH.EMAIL_VERIFIED, { async: true })
  async handleEmailVerified(event: AuthEmailVerifiedEvent): Promise<void> {
    const authPayload = this._parseEmailPayload(event.payload, EVENT_NAMES.AUTH.EMAIL_VERIFIED);

    if (!authPayload) {
      return;
    }

    const { email, userName } = authPayload;

    await this._welcomeEmailService.sendWelcomeEmail({
      to: email,
      name: userName,
    });
  }

  /**
   * Handles password reset request and sends forgot-password email.
   *
   * @param {AuthPasswordResetRequestedEvent} event Auth reset requested event payload.
   */
  @OnEvent(EVENT_NAMES.AUTH.PASSWORD_RESET_REQUESTED, { async: true })
  async handlePasswordResetRequested(event: AuthPasswordResetRequestedEvent): Promise<void> {
    const authPayload = this._parseEmailTokenPayload(
      event.payload,
      EVENT_NAMES.AUTH.PASSWORD_RESET_REQUESTED,
    );

    if (!authPayload) {
      return;
    }

    const { email, userName, token } = authPayload;

    await this._forgotPasswordEmailService.sendForgotPasswordEmail({
      to: email,
      name: userName,
      token,
    });
  }

  /**
   * Handles successful password reset and sends defensive password changed email.
   *
   * @param {AuthPasswordResetEvent} event Auth password reset event payload.
   */
  @OnEvent(EVENT_NAMES.AUTH.PASSWORD_RESET, { async: true })
  async handlePasswordReset(event: AuthPasswordResetEvent): Promise<void> {
    const authPayload = this._parseEmailPayload(event.payload, EVENT_NAMES.AUTH.PASSWORD_RESET);

    if (!authPayload) {
      return;
    }

    const { email, userName } = authPayload;

    await this._passwordChangedEmailService.sendPasswordChangedEmail({
      to: email,
      name: userName,
    });
  }

  /**
   * Parses and validates an auth event payload with email + userName.
   *
   * @param {unknown} payload Raw event payload.
   * @param {string} eventName Domain event name.
   * @returns {EmailPayload | null} Parsed payload when valid, otherwise `null`.
   */
  private _parseEmailPayload(payload: unknown, eventName: string): EmailPayload | null {
    const parsedPayload = EmailPayloadSchema.safeParse(payload);

    if (!parsedPayload.success) {
      this._logger.error(
        { eventName, payload, error: parsedPayload.error },
        'Received invalid auth event payload',
      );
      return null;
    }

    return parsedPayload.data;
  }

  /**
   * Parses and validates an auth event payload with email + userName + token.
   *
   * @param {unknown} payload Raw event payload.
   * @param {string} eventName Domain event name.
   * @returns {EmailTokenPayload | null} Parsed payload when valid, otherwise `null`.
   */
  private _parseEmailTokenPayload(payload: unknown, eventName: string): EmailTokenPayload | null {
    const parsedPayload = EmailTokenPayloadSchema.safeParse(payload);

    if (!parsedPayload.success) {
      this._logger.error(
        { eventName, payload, error: parsedPayload.error },
        'Received invalid auth event payload',
      );
      return null;
    }

    return parsedPayload.data;
  }
}
