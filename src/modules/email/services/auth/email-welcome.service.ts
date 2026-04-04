import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import React from 'react';
import { EMAIL_SENDER } from '../../constants/email.constants';
import type { EmailRecipient, EmailSender } from '../../interfaces';
import { EmailTemplateProvider } from '../../providers/email-template.provider';
import { EmailRecipientSchema } from '../../schemas';
import EmailWelcomeTemplate from '../../templates/auth/EmailWelcomeTemplate';

/**
 * Domain service responsible for welcome email business logic.
 * It validates the recipient payload, renders the template, and dispatches the message.
 */
@Injectable()
export class EmailWelcomeService {
  constructor(
    @Inject(EMAIL_SENDER) private readonly _emailSender: EmailSender,
    private readonly _templateProvider: EmailTemplateProvider,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(EmailWelcomeService.name);
  }

  /**
   * Sends a welcome email to the provided recipient.
   *
   * @param {EmailRecipient} params Welcome email payload.
   * @returns {Promise<void>} Resolves when the email has been sent.
   */
  async sendWelcomeEmail(params: EmailRecipient): Promise<void> {
    try {
      // Validate the external payload before rendering the template.
      const payload = EmailRecipientSchema.parse(params);

      // Render the email body from the React template.
      const element = React.createElement(EmailWelcomeTemplate, {
        name: payload.name,
      });

      const html = await this._templateProvider.render(element);

      // Dispatch the message through the configured email sender.
      await this._emailSender.send({
        to: payload.to,
        subject: 'Welcome to our platform!',
        html,
      });

      this._logger.info({ to: payload.to }, 'Welcome email sent successfully');
    } catch (error: unknown) {
      if (error instanceof Error) {
        this._logger.error(
          { params, error: { name: error.name, message: error.message, stack: error.stack } },
          'Failed to process welcome email',
        );
      } else {
        this._logger.error({ params, error }, 'Failed to process welcome email');
      }

      throw new InternalServerErrorException('Failed to process welcome email');
    }
  }
}
