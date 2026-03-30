import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { getAppInstance } from '../../utils/test-client';
import { settingsEmailSuite } from './settings-email.spec';

describe('SettingsController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await getAppInstance();
  });

  settingsEmailSuite(() => app);
});
