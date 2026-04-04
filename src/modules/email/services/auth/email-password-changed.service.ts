import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import React from 'react';
import { EMAIL_SENDER } from '../../constants/email.constants';
import type { EmailInput, EmailSender } from '../../interfaces';
import { EmailTemplateProvider } from '../../providers/email-template.provider';
import { EmailRecipientSchema } from '../../schemas';
import EmailPasswordChangedTemplate from '../../templates/auth/EmailPasswordChangedTemplate';

/**
 * Domain service responsible for password changed notification emails.
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
   * Sends a password changed notification email.
   *
   * @param {EmailInput} params Recipient payload.
   * @returns {Promise<void>} Resolves when the email has been sent.
   */
  async sendPasswordChangedEmail(params: EmailInput): Promise<void> {
    try {
      // 1. Validate input (Zod)
      const payload = EmailRecipientSchema.parse(params);

      // 2. Build template data
      const dateOptions: Intl.DateTimeFormatOptions = {
        dateStyle: 'long',
        timeStyle: 'medium',
      };
      const changedAt = new Date().toLocaleString('es-ES', dateOptions);

      // 3. Render email template
      const element = React.createElement(EmailPasswordChangedTemplate, {
        name: payload.name,
        changedAt,
      });
      const html = await this._templateProvider.render(element);

      // 4. Dispatch email
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
