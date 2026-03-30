import appConfig from '@/config/app.config';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import React from 'react';
import { EMAIL_SENDER } from '../../constants/email.constants';
import { EmailAuthPath } from '../../enums/email-auth-path.enum';
import { type EmailSender } from '../../interfaces/email-sender.interface';
import { EmailTemplateProvider } from '../../providers/email-template.provider';
import { EmailTokenInput, EmailTokenInputSchema } from '../../schemas';
import ForgotPasswordTemplate from '../../templates/auth/ForgotPasswordTemplate';

/**
 * Domain service responsible for password recovery email business logic.
 */
@Injectable()
export class ForgotPasswordEmailService {
  constructor(
    @Inject(EMAIL_SENDER) private readonly _emailSender: EmailSender,
    @Inject(appConfig.KEY)
    private readonly _config: ConfigType<typeof appConfig>,
    private readonly _templateProvider: EmailTemplateProvider,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(ForgotPasswordEmailService.name);
  }

  /**
   * Sends a password recovery email.
   *
   * @param {EmailTokenInput} params Recipient payload with JWT token.
   * @returns {Promise<void>} Resolves when the email has been sent.
   */
  async sendForgotPasswordEmail(params: EmailTokenInput): Promise<void> {
    try {
      // 1. Validate input (Zod)
      const payload = EmailTokenInputSchema.parse(params);

      // 2. Build CTA URL from externally issued JWT token
      const frontendUrl = this._config.APP_FRONTEND_URL;
      const token = encodeURIComponent(payload.jwtToken);
      const ctaUrl = `${frontendUrl}${EmailAuthPath.RESET_PASSWORD}?token=${token}`;

      // 3. Render email template
      const element = React.createElement(ForgotPasswordTemplate, {
        name: payload.name,
        href: ctaUrl,
      });
      const html = await this._templateProvider.render(element);

      // 4. Dispatch email
      await this._emailSender.send({
        to: payload.to,
        subject: 'Reset your password - AutanaSoft',
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
