import type { PinoLogger } from 'nestjs-pino';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

import * as nodemailer from 'nodemailer';
import { SmtpEmailAdapter, type SmtpCredentials } from './smtp-email.adapter';

describe('SmtpEmailAdapter', () => {
  let adapter: SmtpEmailAdapter;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'info' | 'error'>>;
  let sendMailMock: jest.Mock;

  const smtpConfig: SmtpCredentials = {
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    user: 'smtp-user',
    pass: 'smtp-pass',
  };

  const emailPayload = {
    to: 'test@example.com',
    subject: 'Test subject',
    html: '<p>Hello</p>',
  };

  beforeEach(() => {
    sendMailMock = jest.fn().mockResolvedValue({ messageId: 'message-id-1' });

    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    logger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    };

    adapter = new SmtpEmailAdapter(logger as PinoLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should set logger context in constructor', () => {
    expect(logger.setContext).toHaveBeenCalledWith(SmtpEmailAdapter.name);
  });

  it('should send email through SMTP', async () => {
    await expect(
      adapter.send(emailPayload, smtpConfig, 'no-reply@example.com'),
    ).resolves.toBeUndefined();

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'no-reply@example.com',
      to: emailPayload.to,
      subject: emailPayload.subject,
      html: emailPayload.html,
    });

    expect(logger.info).toHaveBeenCalledWith(
      { messageId: 'message-id-1' },
      'Email sent successfully through SMTP',
    );
  });

  it('should reuse transporter when config has not changed', async () => {
    await adapter.send(emailPayload, smtpConfig, 'no-reply@example.com');
    await adapter.send(emailPayload, smtpConfig, 'no-reply@example.com');

    expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledTimes(2);
  });

  it('should recreate transporter when config changes', async () => {
    await adapter.send(emailPayload, smtpConfig, 'no-reply@example.com');
    await adapter.send(
      emailPayload,
      {
        ...smtpConfig,
        port: 465,
        secure: true,
      },
      'no-reply@example.com',
    );

    expect(nodemailer.createTransport).toHaveBeenCalledTimes(2);
  });

  it('should log and rethrow errors from sendMail', async () => {
    const error = new Error('SMTP failure');
    sendMailMock.mockRejectedValue(error);

    await expect(adapter.send(emailPayload, smtpConfig, 'no-reply@example.com')).rejects.toThrow(
      error,
    );
    expect(logger.error).toHaveBeenCalledWith(
      error,
      'Unexpected error while sending email through SMTP',
    );
  });
});
