import { InternalServerErrorException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { SettingsReadService } from '../../settings/services';
import type { ResendEmailAdapter } from '../adapters/resend-email.adapter';
import type { SmtpEmailAdapter } from '../adapters/smtp-email.adapter';
import { RESEND_EMAIL_ADAPTER, SMTP_EMAIL_ADAPTER } from '../constants/email.constants';
import { EmailDispatcherService } from './email-dispatcher.service';

describe('EmailDispatcherService', () => {
  let service: EmailDispatcherService;
  let settingsReadService: jest.Mocked<Pick<SettingsReadService, 'getEmailSettings'>>;
  let resendAdapter: jest.Mocked<Pick<ResendEmailAdapter, 'send'>>;
  let smtpAdapter: jest.Mocked<Pick<SmtpEmailAdapter, 'send'>>;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'error'>>;

  const emailPayload = {
    to: 'test@example.com',
    subject: 'Subject',
    html: '<p>Body</p>',
  };

  beforeEach(async () => {
    settingsReadService = {
      getEmailSettings: jest.fn(),
    };

    resendAdapter = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    smtpAdapter = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    logger = {
      setContext: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailDispatcherService,
        { provide: SettingsReadService, useValue: settingsReadService },
        { provide: RESEND_EMAIL_ADAPTER, useValue: resendAdapter },
        { provide: SMTP_EMAIL_ADAPTER, useValue: smtpAdapter },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<EmailDispatcherService>(EmailDispatcherService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw when email settings are missing', async () => {
    settingsReadService.getEmailSettings.mockResolvedValue(null);

    await expect(service.send(emailPayload)).rejects.toThrow(InternalServerErrorException);
    expect(logger.error).toHaveBeenCalledWith(
      'Cannot send email: EMAIL_SETTINGS record was not found',
    );
  });

  it('should dispatch using Resend when active provider is resend', async () => {
    settingsReadService.getEmailSettings.mockResolvedValue({
      activeProvider: 'resend',
      defaultFrom: 'no-reply@example.com',
      resend: { apiKey: 'api_key' },
      smtp: null,
    } as never);

    await expect(service.send(emailPayload)).resolves.toBeUndefined();

    expect(resendAdapter.send).toHaveBeenCalledWith(
      emailPayload,
      { apiKey: 'api_key' },
      'no-reply@example.com',
    );
    expect(smtpAdapter.send).not.toHaveBeenCalled();
  });

  it('should throw when resend is active and credentials are missing', async () => {
    settingsReadService.getEmailSettings.mockResolvedValue({
      activeProvider: 'resend',
      defaultFrom: 'no-reply@example.com',
      resend: null,
      smtp: null,
    } as never);

    await expect(service.send(emailPayload)).rejects.toThrow(InternalServerErrorException);
    expect(resendAdapter.send).not.toHaveBeenCalled();
  });

  it('should dispatch using SMTP when active provider is smtp', async () => {
    settingsReadService.getEmailSettings.mockResolvedValue({
      activeProvider: 'smtp',
      defaultFrom: 'no-reply@example.com',
      resend: null,
      smtp: {
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        user: 'user',
        pass: 'pass',
      },
    } as never);

    await expect(service.send(emailPayload)).resolves.toBeUndefined();

    expect(smtpAdapter.send).toHaveBeenCalledWith(
      emailPayload,
      {
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        user: 'user',
        pass: 'pass',
      },
      'no-reply@example.com',
    );
    expect(resendAdapter.send).not.toHaveBeenCalled();
  });

  it('should throw when smtp is active and credentials are missing', async () => {
    settingsReadService.getEmailSettings.mockResolvedValue({
      activeProvider: 'smtp',
      defaultFrom: 'no-reply@example.com',
      resend: null,
      smtp: null,
    } as never);

    await expect(service.send(emailPayload)).rejects.toThrow(InternalServerErrorException);
    expect(smtpAdapter.send).not.toHaveBeenCalled();
  });
});
