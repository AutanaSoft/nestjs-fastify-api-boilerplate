import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PinoLogger } from 'nestjs-pino';
import type { EmailAdapter } from '../interfaces';

export interface SmtpCredentials {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

/**
 * Dynamic adapter for sending emails through an SMTP provider.
 * Receives credentials through method parameters for database-driven runtime configuration.
 */
@Injectable()
export class SmtpEmailAdapter {
  private _transporter: nodemailer.Transporter | null = null;
  private _lastConfigStr: string = '';

  constructor(private readonly _logger: PinoLogger) {
    this._logger.setContext(SmtpEmailAdapter.name);
  }

  /**
   * Builds or reuses a transporter instance based on credential changes.
   */
  private _getTransporter(config: SmtpCredentials): nodemailer.Transporter {
    const confStr = JSON.stringify(config);
    if (this._transporter && this._lastConfigStr === confStr) {
      return this._transporter;
    }

    this._transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    this._lastConfigStr = confStr;
    return this._transporter;
  }

  /**
   * Sends an email through SMTP transport.
   *
   * @param {EmailAdapter} data Email payload.
   * @param config SMTP credentials.
   * @param defaultFrom Default sender address.
   */
  async send(data: EmailAdapter, config: SmtpCredentials, defaultFrom: string): Promise<void> {
    try {
      this._logger.info({ to: data.to, subject: data.subject }, 'Sending email through SMTP');

      const transporter = this._getTransporter(config);
      const info = (await transporter.sendMail({
        from: defaultFrom,
        to: data.to,
        subject: data.subject,
        html: data.html,
      })) as { messageId: string };

      this._logger.info({ messageId: info.messageId }, 'Email sent successfully through SMTP');
    } catch (error: unknown) {
      this._logger.error(error, 'Unexpected error while sending email through SMTP');
      throw error;
    }
  }
}
