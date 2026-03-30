import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { getAppInstance } from './utils/test-client';

/**
 * Suite E2E básica para pruebas de humo (Smoke Tests) a nivel raíz.
 * Ya no actúa como orquestador maestro, sino como un test independiente más.
 */
describe('App Root (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await getAppInstance();
  });

  // Test de arranque básico (Smoke Test)
  describe('Root', () => {
    it('debería responder con éxito en el endpoint de ping', async () => {
      return request(app.getHttpServer()).get('/health/ping').expect(200).expect('pong');
    });

    it('debería capturar errores globales mediante el filtro (GlobalExceptionFilter)', async () => {
      return request(app.getHttpServer())
        .get('/non-existent-route')
        .expect(404)
        .expect((res: request.Response) => {
          const body = res.body as Record<string, unknown>;
          expect(body).toHaveProperty('timestamp');
          expect(body).toHaveProperty('path');
          expect(body.error).toHaveProperty('message');
        });
    });
  });
});
