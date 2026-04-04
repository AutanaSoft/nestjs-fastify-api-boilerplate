import appConfig from '@/config/app.config';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import React from 'react';
import { EMAIL_SENDER } from '../../constants/email.constants';
import { EmailAuthPath } from '../../enums/email-auth-path.enum';
import type { EmailSender, EmailTokenInput } from '../../interfaces';
import { EmailTemplateProvider } from '../../providers/email-template.provider';
import { EmailRecipientTokenSchema } from '../../schemas';
import EmailVerifyTemplate from '../../templates/auth/EmailVerifyTemplate';

/**
 * Domain service responsible for verification email business logic.
 */
@Injectable()
export class EmailVerifyService {
  constructor(
    @Inject(EMAIL_SENDER) private readonly _emailSender: EmailSender,
    @Inject(appConfig.KEY)
    private readonly _config: ConfigType<typeof appConfig>,
    private readonly _templateProvider: EmailTemplateProvider,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(EmailVerifyService.name);
  }

  /**
   * Sends an account verification email.
   *
   * @param {EmailTokenInput} params Recipient payload with JWT token.
   * @returns {Promise<void>} Resolves when the email has been sent.
   */
  async sendVerifyEmail(params: EmailTokenInput): Promise<void> {
    try {
      // 1. Validate input (Zod)
      const payload = EmailRecipientTokenSchema.parse(params);

      // 2. Build CTA URL from externally issued JWT token
      const frontendUrl = this._config.APP_FRONTEND_URL;
      const token = encodeURIComponent(payload.token);
      const ctaUrl = `${frontendUrl}${EmailAuthPath.VERIFY_EMAIL}?token=${token}`;

      // 3. Render email template
      const element = React.createElement(EmailVerifyTemplate, {
        name: payload.name,
        href: ctaUrl,
      });
      const html = await this._templateProvider.render(element);

      // 4. Dispatch email
      await this._emailSender.send({
        to: payload.to,
        subject: 'Confirm your email address',
        html,
      });

      this._logger.info({ to: payload.to }, 'Verification email sent successfully');
    } catch (error: unknown) {
      if (error instanceof Error) {
        this._logger.error(
          { params, error: { name: error.name, message: error.message, stack: error.stack } },
          'Failed to process verification email',
        );
      } else {
        this._logger.error({ params, error }, 'Failed to process verification email');
      }

      throw new InternalServerErrorException('Failed to process verification email');
    }
  }
}
