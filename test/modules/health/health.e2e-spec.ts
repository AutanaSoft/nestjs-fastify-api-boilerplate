import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { getAppInstance } from '../../utils/test-client';
import { healthReadSuite } from './health-read.spec';

describe('HealthController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await getAppInstance();
  });

  healthReadSuite(() => app);
});
