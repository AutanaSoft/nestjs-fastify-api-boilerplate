import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { UsersE2EContext } from './users.e2e.types';

export const usersSecuritySuite = (
  getApp: () => NestFastifyApplication,
  context: UsersE2EContext,
) => {
  describe('Users Security (e2e)', () => {
    let app: NestFastifyApplication;
    let regularUserId: string;
    let currentPassword: string;

    const getAdminToken = (): string => {
      if (!context.adminUser.accessToken) {
        throw new Error('Admin access token is required for users security suite');
      }

      return context.adminUser.accessToken;
    };

    const getRegularToken = (): string => {
      if (!context.regularUser.accessToken) {
        throw new Error('Regular access token is required for users security suite');
      }

      return context.regularUser.accessToken;
    };

    beforeAll(() => {
      app = getApp();

      if (!context.regularUser.id) {
        throw new Error('usersSecuritySuite requires regular user id from e2e bootstrap');
      }

      regularUserId = context.regularUser.id;
      currentPassword = context.regularUser.password;
    });

    describe('PATCH /users/:id/password', () => {
      it('should return 401 when token is missing', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${regularUserId}/password`)
          .send({
            current: currentPassword,
            new: 'NextPassword123!',
            confirm: 'NextPassword123!',
          })
          .expect(401);
      });

      it('should return 403 when requester is neither owner nor admin', async () => {
        if (!context.managedUserId) {
          throw new Error('managedUserId is required for forbidden password update test');
        }

        await request(app.getHttpServer())
          .patch(`/users/${context.managedUserId}/password`)
          .set('Authorization', `Bearer ${getRegularToken()}`)
          .send({
            current: currentPassword,
            new: 'NextPassword123!',
            confirm: 'NextPassword123!',
          })
          .expect(403);
      });

      it('should return 400 when id is not a valid uuid', async () => {
        await request(app.getHttpServer())
          .patch('/users/invalid-id/password')
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .send({
            current: currentPassword,
            new: 'NextPassword123!',
            confirm: 'NextPassword123!',
          })
          .expect(400);
      });

      it('should return 400 when all password fields are invalid', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${regularUserId}/password`)
          .set('Authorization', `Bearer ${getRegularToken()}`)
          .send({
            current: '123',
            new: '123',
            confirm: '123',
          })
          .expect(400);
      });

      it('should return 400 when new and confirm do not match', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${regularUserId}/password`)
          .set('Authorization', `Bearer ${getRegularToken()}`)
          .send({
            current: currentPassword,
            new: 'NextPassword123!',
            confirm: 'DifferentPassword123!',
          })
          .expect(400);
      });

      it('should return 404 when user does not exist', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${randomUUID()}/password`)
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .send({
            current: currentPassword,
            new: 'NextPassword123!',
            confirm: 'NextPassword123!',
          })
          .expect(404);
      });

      it('should return 400 when current password is invalid', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${regularUserId}/password`)
          .set('Authorization', `Bearer ${getRegularToken()}`)
          .send({
            current: 'OtherPass123!',
            new: 'NextPassword123!',
            confirm: 'NextPassword123!',
          })
          .expect(400)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            const error = body.error as Record<string, unknown>;
            expect(error.message).toBe('Current password is invalid');
          });
      });

      it('should update password with valid payload when requester is owner', async () => {
        const nextPassword = 'NextPassword123!';

        await request(app.getHttpServer())
          .patch(`/users/${regularUserId}/password`)
          .set('Authorization', `Bearer ${getRegularToken()}`)
          .send({
            current: currentPassword,
            new: nextPassword,
            confirm: nextPassword,
          })
          .expect(204);

        currentPassword = nextPassword;
        context.regularUser.password = nextPassword;
      });
    });
  });
};
