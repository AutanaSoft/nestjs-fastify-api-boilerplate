import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { EmailSender } from '../interfaces/email-sender.interface';
import type { EmailAdapter } from '../schemas';
import { SettingsReadService } from '../../settings/services';
import { SmtpEmailAdapter } from '../adapters/smtp-email.adapter';
import { ResendEmailAdapter } from '../adapters/resend-email.adapter';
import { RESEND_EMAIL_ADAPTER, SMTP_EMAIL_ADAPTER } from '../constants/email.constants';

@Injectable()
export class EmailDispatcherService implements EmailSender {
  constructor(
    private readonly _settingsReadService: SettingsReadService,
    @Inject(RESEND_EMAIL_ADAPTER)
    private readonly _resendEmailAdapter: ResendEmailAdapter,
    @Inject(SMTP_EMAIL_ADAPTER)
    private readonly _smtpEmailAdapter: SmtpEmailAdapter,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(EmailDispatcherService.name);
  }

  async send(data: EmailAdapter): Promise<void> {
    const config = await this._settingsReadService.getEmailSettings(false);

    if (!config) {
      this._logger.error('Cannot send email: EMAIL_SETTINGS record was not found');
      throw new InternalServerErrorException('Email configuration was not found');
    }

    if (config.activeProvider === 'resend') {
      if (!config.resend) {
        throw new InternalServerErrorException(
          'Active provider is Resend but credentials are missing',
        );
      }

      await this._resendEmailAdapter.send(data, config.resend, config.defaultFrom);
      return;
    }

    // SMTP flow
    if (!config.smtp) {
      throw new InternalServerErrorException('Active provider is SMTP but credentials are missing');
    }

    await this._smtpEmailAdapter.send(data, config.smtp, config.defaultFrom);
  }
}
