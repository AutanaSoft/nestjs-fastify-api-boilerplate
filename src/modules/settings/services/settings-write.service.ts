import { PrismaService } from '@modules/database/services/prisma.service';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { UpdateEmailSettingsDto } from '../dto/settings.dto';
import { SettingsReadService } from './settings-read.service';
import { type EmailSettingsConfig } from '../schemas/settings.schema';

@Injectable()
export class SettingsWriteService {
  constructor(
    private readonly _prisma: PrismaService,
    private readonly _settingsReadService: SettingsReadService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(SettingsWriteService.name);
  }

  /**
   * Updates the email configuration. Preserves old passwords if the payload
   * includes "***" (the default masking behavior of the ReadService).
   */
  async updateEmailSettings(payload: UpdateEmailSettingsDto): Promise<void> {
    try {
      const current = await this._settingsReadService.getEmailSettings(false);
      const newSettings = structuredClone(payload) as EmailSettingsConfig;

      if (current) {
        if (newSettings.smtp?.pass === '***') {
          newSettings.smtp.pass = current.smtp?.pass ?? '';
        }
        if (newSettings.resend?.apiKey === '***') {
          newSettings.resend.apiKey = current.resend?.apiKey ?? '';
        }
      }

      await this._prisma.appSetting.upsert({
        where: { key: 'EMAIL_SETTINGS' },
        update: { value: newSettings },
        create: {
          key: 'EMAIL_SETTINGS',
          isSystem: true,
          value: newSettings,
        },
      });

      this._logger.info('Email settings updated successfully');
    } catch (error: unknown) {
      this._logger.error({ error }, 'Error updating EMAIL_SETTINGS');
      throw new InternalServerErrorException('Could not update email configuration');
    }
  }
}
