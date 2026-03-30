import { SettingsReadService, SettingsWriteService } from '@/modules/settings/services';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { validSettingsPayload } from '../../utils/test-constants';

export const settingsEmailSuite = (getApp: () => NestFastifyApplication) => {
  describe('Settings Email (e2e)', () => {
    let app: NestFastifyApplication;
    let settingsReadService: SettingsReadService;
    let settingsWriteService: SettingsWriteService;
    let getEmailSettingsSpy: jest.SpiedFunction<SettingsReadService['getEmailSettings']>;
    let updateEmailSettingsSpy: jest.SpiedFunction<SettingsWriteService['updateEmailSettings']>;

    beforeAll(() => {
      app = getApp();
      settingsReadService = app.get(SettingsReadService);
      settingsWriteService = app.get(SettingsWriteService);

      getEmailSettingsSpy = jest
        .spyOn(settingsReadService, 'getEmailSettings')
        .mockResolvedValue(validSettingsPayload);
      updateEmailSettingsSpy = jest
        .spyOn(settingsWriteService, 'updateEmailSettings')
        .mockResolvedValue(undefined);
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    describe('PATCH /settings/email', () => {
      it('should update settings with a valid payload', async () => {
        await request(app.getHttpServer())
          .patch('/settings/email')
          .send(validSettingsPayload)
          .expect(200);

        expect(updateEmailSettingsSpy).toHaveBeenCalledWith(validSettingsPayload);
      });

      it('should return 400 when payload is invalid', async () => {
        const invalidPayload = {
          ...validSettingsPayload,
          defaultFrom: 'invalid-email',
        };

        await request(app.getHttpServer())
          .patch('/settings/email')
          .send(invalidPayload)
          .expect(400);
      });
    });

    describe('GET /settings/email', () => {
      it('should return email settings from mocked service', async () => {
        await request(app.getHttpServer())
          .get('/settings/email')
          .expect(200)
          .expect((res: request.Response) => {
            const body = res.body as Record<string, unknown>;
            expect(body).toEqual(expect.objectContaining(validSettingsPayload));
          });

        expect(getEmailSettingsSpy).toHaveBeenCalledWith(true);
      });
    });
  });
};
