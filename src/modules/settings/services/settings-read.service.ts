import { PrismaService } from '@modules/database/services/prisma.service';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { EmailSettingsSchema, type EmailSettingsConfig } from '../schemas/settings.schema';

@Injectable()
export class SettingsReadService {
  constructor(
    private readonly _prisma: PrismaService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(SettingsReadService.name);
  }

  /**
   * Retrieves email settings from the database (key: EMAIL_SETTINGS),
   * querying Prisma directly on every invocation.
   * Depending on the usage, a flag can be passed to mask values or hide credentials.
   *
   * @param maskCredentials If true, masks passwords before returning. (Default false for internal use)
   */
  async getEmailSettings(maskCredentials = false): Promise<EmailSettingsConfig | null> {
    try {
      const setting = await this._prisma.appSetting.findUnique({
        where: { key: 'EMAIL_SETTINGS' },
      });

      if (!setting) {
        this._logger.warn('The EMAIL_SETTINGS key was not found in the database.');
        return null;
      }

      const parsed = EmailSettingsSchema.safeParse(setting.value as unknown);
      if (!parsed.success) {
        this._logger.error(
          { error: parsed.error },
          'The EMAIL_SETTINGS configuration has an invalid JSON.',
        );
        throw new InternalServerErrorException('Invalid email configuration in Database');
      }

      const data = parsed.data;

      if (maskCredentials) {
        if (data.smtp?.pass) data.smtp.pass = '***';
        if (data.resend?.apiKey) data.resend.apiKey = '***';
      }

      return data;
    } catch (error: unknown) {
      this._logger.error({ error }, 'Error retrieving EMAIL_SETTINGS');
      throw error;
    }
  }
}
