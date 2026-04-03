import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import type { UsersE2EContext } from './users.e2e.types';

export const usersMeSuite = (getApp: () => NestFastifyApplication, context: UsersE2EContext) => {
  describe('GET /users/me (e2e)', () => {
    let app: NestFastifyApplication;

    const getAdminToken = (): string => {
      if (!context.adminUser.accessToken) {
        throw new Error('Admin access token is required for users me suite');
      }

      return context.adminUser.accessToken;
    };

    const getRegularToken = (): string => {
      if (!context.regularUser.accessToken) {
        throw new Error('Regular access token is required for users me suite');
      }

      return context.regularUser.accessToken;
    };

    beforeAll(() => {
      app = getApp();
    });

    it('should return 401 when token is missing', async () => {
      await request(app.getHttpServer()).get('/users/me').expect(401);
    });

    it('should return current regular user when token is regular', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${getRegularToken()}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as Record<string, unknown>;
          expect(body.id).toBe(context.regularUser.id);
          expect(body.email).toBe(context.regularUser.email);
          expect(body.password).toBeUndefined();
        });
    });

    it('should return current admin user when token is admin', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as Record<string, unknown>;
          expect(body.id).toBe(context.adminUser.id);
          expect(body.email).toBe(context.adminUser.email);
          expect(body.password).toBeUndefined();
        });
    });
  });
};
