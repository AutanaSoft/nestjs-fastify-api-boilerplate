import { Test, type TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsReadService, SettingsWriteService } from '../services';

describe('SettingsController', () => {
  let controller: SettingsController;
  let settingsReadService: jest.Mocked<Pick<SettingsReadService, 'getEmailSettings'>>;
  let settingsWriteService: jest.Mocked<Pick<SettingsWriteService, 'updateEmailSettings'>>;

  beforeEach(async () => {
    settingsReadService = {
      getEmailSettings: jest.fn(),
    };

    settingsWriteService = {
      updateEmailSettings: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        { provide: SettingsReadService, useValue: settingsReadService },
        { provide: SettingsWriteService, useValue: settingsWriteService },
      ],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get email settings with masked credentials', async () => {
    settingsReadService.getEmailSettings.mockResolvedValue({
      activeProvider: 'smtp',
      defaultFrom: 'no-reply@example.com',
      smtp: {
        host: 'smtp.example.com',
        port: 587,
        user: 'user',
        pass: '***',
        secure: false,
      },
    });

    await expect(controller.getEmailSettings()).resolves.toEqual({
      activeProvider: 'smtp',
      defaultFrom: 'no-reply@example.com',
      smtp: {
        host: 'smtp.example.com',
        port: 587,
        user: 'user',
        pass: '***',
        secure: false,
      },
    });

    expect(settingsReadService.getEmailSettings).toHaveBeenCalledWith(true);
  });

  it('should update email settings', async () => {
    settingsWriteService.updateEmailSettings.mockResolvedValue(undefined);

    const payload = {
      activeProvider: 'resend',
      defaultFrom: 'no-reply@example.com',
      resend: {
        apiKey: 'new-key',
      },
    };

    await expect(controller.updateEmailSettings(payload as never)).resolves.toBeUndefined();
    expect(settingsWriteService.updateEmailSettings).toHaveBeenCalledWith(payload);
  });
});
