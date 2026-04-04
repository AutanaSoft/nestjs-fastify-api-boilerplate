import appConfig from '@/config/app.config';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import React from 'react';
import { EMAIL_SENDER } from '../../constants/email.constants';
import { EmailAuthPath } from '../../enums/email-auth-path.enum';
import type { EmailRecipientToken, EmailSender } from '../../interfaces';
import { EmailTemplateProvider } from '../../providers/email-template.provider';
import { EmailRecipientTokenSchema } from '../../schemas';
import EmailForgotPasswordTemplate from '../../templates/auth/EmailForgotPasswordTemplate';

/**
 * Domain service responsible for password recovery email business logic.
 * It validates the recipient payload, builds the reset URL, renders the template, and dispatches the message.
 */
@Injectable()
export class EmailForgotPasswordService {
  constructor(
    @Inject(EMAIL_SENDER) private readonly _emailSender: EmailSender,
    @Inject(appConfig.KEY)
    private readonly _config: ConfigType<typeof appConfig>,
    private readonly _templateProvider: EmailTemplateProvider,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(EmailForgotPasswordService.name);
  }

  /**
   * Sends a password recovery email to the provided recipient.
   *
   * @param {EmailRecipientToken} params Recipient payload that includes the reset token.
   * @returns {Promise<void>} Resolves when the email has been sent.
   */
  async sendForgotPasswordEmail(params: EmailRecipientToken): Promise<void> {
    try {
      // Validate and normalize the external payload before using the token in the URL.
      const payload = EmailRecipientTokenSchema.parse(params);

      const frontendUrl = this._config.APP_FRONTEND_URL;
      // Encode the token because it is propagated through a query string parameter.
      const token = encodeURIComponent(payload.token);
      const ctaUrl = `${frontendUrl}${EmailAuthPath.RESET_PASSWORD}?token=${token}`;

      // Render the email body from the React template.
      const element = React.createElement(EmailForgotPasswordTemplate, {
        name: payload.name,
        href: ctaUrl,
      });
      const html = await this._templateProvider.render(element);

      // Send the final message through the configured adapter.
      await this._emailSender.send({
        to: payload.to,
        subject: 'Reset your password',
        html,
      });

      this._logger.info({ to: payload.to }, 'Password recovery email sent successfully');
    } catch (error: unknown) {
      if (error instanceof Error) {
        this._logger.error(
          { params, error: { name: error.name, message: error.message, stack: error.stack } },
          'Failed to process password recovery email',
        );
      } else {
        this._logger.error({ params, error }, 'Failed to process password recovery email');
      }

      throw new InternalServerErrorException('Failed to process password recovery email');
    }
  }
}
