import { PrismaService } from '@modules/database/services/prisma.service';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { SettingsReadService } from './settings-read.service';

describe('SettingsReadService', () => {
  let service: SettingsReadService;
  let findUniqueMock: jest.Mock;
  let prisma: PrismaService;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'warn' | 'error'>>;

  beforeEach(async () => {
    findUniqueMock = jest.fn();
    prisma = {
      appSetting: {
        findUnique: findUniqueMock,
      },
    } as unknown as PrismaService;

    logger = {
      setContext: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsReadService,
        { provide: PrismaService, useValue: prisma },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<SettingsReadService>(SettingsReadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return null when setting does not exist', async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(service.getEmailSettings()).resolves.toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      'The EMAIL_SETTINGS key was not found in the database.',
    );
  });

  it('should return parsed settings when payload is valid', async () => {
    findUniqueMock.mockResolvedValue({
      key: 'EMAIL_SETTINGS',
      value: {
        activeProvider: 'smtp',
        defaultFrom: 'no-reply@example.com',
        smtp: {
          host: 'smtp.example.com',
          port: 587,
          user: 'user',
          pass: 'pass',
          secure: false,
        },
      },
    } as never);

    await expect(service.getEmailSettings(false)).resolves.toEqual({
      activeProvider: 'smtp',
      defaultFrom: 'no-reply@example.com',
      smtp: {
        host: 'smtp.example.com',
        port: 587,
        user: 'user',
        pass: 'pass',
        secure: false,
      },
    });
  });

  it('should mask credentials when maskCredentials is true', async () => {
    findUniqueMock.mockResolvedValue({
      key: 'EMAIL_SETTINGS',
      value: {
        activeProvider: 'resend',
        defaultFrom: 'no-reply@example.com',
        resend: { apiKey: 'secret' },
        smtp: {
          host: 'smtp.example.com',
          port: 465,
          user: 'user',
          pass: 'smtp-secret',
          secure: true,
        },
      },
    } as never);

    await expect(service.getEmailSettings(true)).resolves.toEqual({
      activeProvider: 'resend',
      defaultFrom: 'no-reply@example.com',
      resend: { apiKey: '***' },
      smtp: {
        host: 'smtp.example.com',
        port: 465,
        user: 'user',
        pass: '***',
        secure: true,
      },
    });
  });

  it('should throw InternalServerErrorException when payload is invalid', async () => {
    findUniqueMock.mockResolvedValue({
      key: 'EMAIL_SETTINGS',
      value: {
        activeProvider: 'smtp',
        defaultFrom: 'invalid-email',
      },
    } as never);

    await expect(service.getEmailSettings()).rejects.toThrow(InternalServerErrorException);
    expect(logger.error).toHaveBeenCalled();
  });

  it('should rethrow unexpected errors from persistence layer', async () => {
    const error = new Error('DB down');
    findUniqueMock.mockRejectedValue(error);

    await expect(service.getEmailSettings()).rejects.toThrow(error);
    expect(logger.error).toHaveBeenCalledWith({ error }, 'Error retrieving EMAIL_SETTINGS');
  });
});
