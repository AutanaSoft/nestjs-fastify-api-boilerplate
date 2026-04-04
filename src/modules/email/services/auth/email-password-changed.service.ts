import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import React from 'react';
import { EMAIL_SENDER } from '../../constants/email.constants';
import type { EmailRecipient, EmailSender } from '../../interfaces';
import { EmailTemplateProvider } from '../../providers/email-template.provider';
import { EmailRecipientSchema } from '../../schemas';
import EmailPasswordChangedTemplate from '../../templates/auth/EmailPasswordChangedTemplate';

/**
 * Domain service responsible for password change notification emails.
 * It validates the recipient payload, renders the notification template, and dispatches the email.
 */
@Injectable()
export class EmailPasswordChangedService {
  constructor(
    @Inject(EMAIL_SENDER) private readonly _emailSender: EmailSender,
    private readonly _templateProvider: EmailTemplateProvider,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(EmailPasswordChangedService.name);
  }

  /**
   * Sends a password changed notification email to the provided recipient.
   *
   * @param {EmailRecipient} params Recipient payload for the notification email.
   * @returns {Promise<void>} Resolves when the email has been sent.
   */
  async sendPasswordChangedEmail(params: EmailRecipient): Promise<void> {
    try {
      // Validate the external payload before building the notification content.
      const payload = EmailRecipientSchema.parse(params);

      const dateOptions: Intl.DateTimeFormatOptions = {
        dateStyle: 'long',
        timeStyle: 'medium',
      };
      // Keep the display timestamp localized for the notification body.
      const changedAt = new Date().toLocaleString('es-ES', dateOptions);

      // Render the email body from the React template.
      const element = React.createElement(EmailPasswordChangedTemplate, {
        name: payload.name,
        changedAt,
      });
      const html = await this._templateProvider.render(element);

      // Dispatch the notification through the configured email sender.
      await this._emailSender.send({
        to: payload.to,
        subject: 'Your password was changed successfully',
        html,
      });

      this._logger.info({ to: payload.to }, 'Password changed notification sent successfully');
    } catch (error: unknown) {
      if (error instanceof Error) {
        this._logger.error(
          { params, error: { name: error.name, message: error.message, stack: error.stack } },
          'Failed to process password changed email',
        );
      } else {
        this._logger.error({ params, error }, 'Failed to process password changed email');
      }

      throw new InternalServerErrorException('Failed to process password changed email');
    }
  }
}
