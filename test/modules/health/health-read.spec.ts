import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';

export const healthReadSuite = (getApp: () => NestFastifyApplication) => {
  describe('Health Read (e2e)', () => {
    let app: NestFastifyApplication;

    beforeAll(() => {
      app = getApp();
    });

    it('should return system health status', async () => {
      const response = await request(app.getHttpServer()).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          status: 'ok',
        }),
      );
      expect(response.body).toHaveProperty('info');
      expect(response.body).toHaveProperty('details');
    });

    it('should return pong from ping endpoint', async () => {
      const response = await request(app.getHttpServer()).get('/health/ping');

      expect(response.status).toBe(200);
      expect(response.text).toBe('pong');
    });
  });
};
