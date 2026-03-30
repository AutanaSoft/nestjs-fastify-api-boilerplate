import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Resend } from 'resend';
import type { EmailAdapter } from '../schemas';

/**
 * Dynamic adapter for sending emails through Resend.
 * Instantiates the client at send time using database-provided credentials.
 */
@Injectable()
export class ResendEmailAdapter {
  private _resendClient: Resend | null = null;
  private _lastApiKey: string = '';

  constructor(private readonly _logger: PinoLogger) {
    this._logger.setContext(ResendEmailAdapter.name);
  }

  private _getClient(apiKey: string): Resend {
    if (this._resendClient && this._lastApiKey === apiKey) {
      return this._resendClient;
    }
    this._resendClient = new Resend(apiKey);
    this._lastApiKey = apiKey;
    return this._resendClient;
  }

  /**
   * Sends an email using the Resend API.
   *
   * @param {EmailAdapter} data Email payload.
   * @param config Resend credentials.
   * @param defaultFrom Sender address.
   */
  async send(data: EmailAdapter, config: { apiKey: string }, defaultFrom: string): Promise<void> {
    try {
      const { to, subject, html } = data;

      this._logger.info({ to, subject }, 'Sending email through Resend');

      const resend = this._getClient(config.apiKey);
      const response = (await resend.emails.send({
        from: `AutanaSoft<${defaultFrom}>`,
        to,
        subject,
        html,
      })) as unknown as { data: { id: string } | null; error: { message: string } | null };

      if (response.error) {
        this._logger.error({ error: response.error }, 'Failed to send email through Resend');
        throw new Error(`Email delivery failed: ${response.error.message}`);
      }

      this._logger.info({ id: response.data?.id }, 'Email sent successfully through Resend');
    } catch (error: unknown) {
      this._logger.error(error, 'Unexpected error while sending email');
      throw error;
    }
  }
}
