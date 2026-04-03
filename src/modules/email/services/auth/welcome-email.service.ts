import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import React from 'react';
import { EMAIL_SENDER } from '../../constants/email.constants';
import type { EmailInput, EmailSender } from '../../interfaces';
import { EmailTemplateProvider } from '../../providers/email-template.provider';
import { EmailInputSchema } from '../../schemas';
import WelcomeEmailTemplate from '../../templates/auth/WelcomeEmailTemplate';

/**
 * Domain service responsible for welcome email business logic.
 * Follows the flow: Event/Use-case -> Service -> Adapter/Provider.
 */
@Injectable()
export class WelcomeEmailService {
  constructor(
    @Inject(EMAIL_SENDER) private readonly _emailSender: EmailSender,
    private readonly _templateProvider: EmailTemplateProvider,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(WelcomeEmailService.name);
  }

  /**
   * Orchestrates the full welcome email workflow.
   * Single responsibility: define what to send and to whom, delegating delivery details.
   *
   * @param {EmailInput} params Welcome email payload.
   * @returns {Promise<void>} Resolves when the email has been sent.
   */
  async sendWelcomeEmail(params: EmailInput): Promise<void> {
    try {
      // 1. Validate input (Zod)
      const payload = EmailInputSchema.parse(params);

      // 2. Prepare UI content
      const element = React.createElement(WelcomeEmailTemplate, {
        name: payload.name,
      });

      // Delegate template rendering to the provider
      const html = await this._templateProvider.render(element);

      // 3. Dispatch through infrastructure sender
      await this._emailSender.send({
        to: payload.to,
        subject: '¡Bienvenido a AutanaSoft!',
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
