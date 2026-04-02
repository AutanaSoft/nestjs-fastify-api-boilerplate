import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import type { AuthE2EContext } from './auth.e2e.types';

export const authSessionSuite = (getApp: () => NestFastifyApplication, context: AuthE2EContext) => {
  describe('Auth Session Routes (e2e)', () => {
    let app: NestFastifyApplication;

    beforeAll(() => {
      app = getApp();
    });

    describe('POST /auth/sign-out', () => {
      it('should return 401 without bearer token', async () => {
        await request(app.getHttpServer()).post('/auth/sign-out').expect(401);
      });

      it('should sign out current session and invalidate refresh token', async () => {
        const signInResponse = await request(app.getHttpServer())
          .post('/auth/sign-in')
          .send({
            email: context.primaryUser.email,
            password: context.primaryUser.password,
          })
          .expect(200);

        const session = signInResponse.body as Record<string, unknown>;
        const accessToken = session.accessToken as string;
        const refreshToken = session.refreshToken as string;

        await request(app.getHttpServer())
          .post('/auth/sign-out')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(204);

        await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken }).expect(401);
      });
    });
  });
};
