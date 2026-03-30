import { PrismaService } from '@modules/database/services/prisma.service';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { SettingsReadService } from './settings-read.service';
import { SettingsWriteService } from './settings-write.service';

describe('SettingsWriteService', () => {
  let service: SettingsWriteService;
  let upsertMock: jest.Mock;
  let prisma: PrismaService;
  let settingsReadService: jest.Mocked<Pick<SettingsReadService, 'getEmailSettings'>>;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'info' | 'error'>>;

  beforeEach(async () => {
    upsertMock = jest.fn();
    prisma = {
      appSetting: {
        upsert: upsertMock,
      },
    } as unknown as PrismaService;

    settingsReadService = {
      getEmailSettings: jest.fn(),
    };

    logger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsWriteService,
        { provide: PrismaService, useValue: prisma },
        { provide: SettingsReadService, useValue: settingsReadService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<SettingsWriteService>(SettingsWriteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upsert payload directly when no current settings exist', async () => {
    settingsReadService.getEmailSettings.mockResolvedValue(null);
    upsertMock.mockResolvedValue({} as never);

    const payload = {
      activeProvider: 'smtp',
      defaultFrom: 'no-reply@example.com',
      smtp: {
        host: 'smtp.example.com',
        port: 587,
        user: 'user',
        pass: 'new-pass',
        secure: false,
      },
    };

    await expect(service.updateEmailSettings(payload as never)).resolves.toBeUndefined();
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'EMAIL_SETTINGS' },
        update: { value: payload },
      }),
    );
    expect(logger.info).toHaveBeenCalledWith('Email settings updated successfully');
  });

  it('should preserve smtp password and resend api key when payload is masked', async () => {
    settingsReadService.getEmailSettings.mockResolvedValue({
      activeProvider: 'resend',
      defaultFrom: 'no-reply@example.com',
      smtp: {
        host: 'smtp.example.com',
        port: 465,
        user: 'smtp-user',
        pass: 'stored-smtp-pass',
        secure: true,
      },
      resend: {
        apiKey: 'stored-resend-key',
      },
    });

    upsertMock.mockResolvedValue({} as never);

    const payload = {
      activeProvider: 'resend',
      defaultFrom: 'no-reply@example.com',
      smtp: {
        host: 'smtp.example.com',
        port: 465,
        user: 'smtp-user',
        pass: '***',
        secure: true,
      },
      resend: {
        apiKey: '***',
      },
    };

    await expect(service.updateEmailSettings(payload as never)).resolves.toBeUndefined();
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          value: {
            ...payload,
            smtp: {
              ...payload.smtp,
              pass: 'stored-smtp-pass',
            },
            resend: {
              apiKey: 'stored-resend-key',
            },
          },
        },
      }),
    );
  });

  it('should throw InternalServerErrorException when persistence fails', async () => {
    settingsReadService.getEmailSettings.mockResolvedValue(null);
    upsertMock.mockRejectedValue(new Error('db error'));

    await expect(
      service.updateEmailSettings({
        activeProvider: 'smtp',
        defaultFrom: 'no-reply@example.com',
      } as never),
    ).rejects.toThrow(InternalServerErrorException);

    expect(logger.error).toHaveBeenCalled();
  });
});
