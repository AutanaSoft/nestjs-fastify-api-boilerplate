import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createUserPayloadBase } from '../../utils/test-constants';
import type { UsersE2EContext } from './users.e2e.types';

export const usersSecuritySuite = (
  getApp: () => NestFastifyApplication,
  context: UsersE2EContext,
) => {
  describe('Users Security (e2e)', () => {
    let app: NestFastifyApplication;
    let createdUserId: string;
    let currentPassword = createUserPayloadBase.password;

    beforeAll(() => {
      app = getApp();

      const [firstCreatedUserId] = context.createdUserIds;
      if (!firstCreatedUserId) {
        throw new Error('usersSecuritySuite requires a created user id in context');
      }

      createdUserId = firstCreatedUserId;
    });

    describe('PATCH /users/:id/password', () => {
      it('should return 400 when id is not a valid uuid', async () => {
        await request(app.getHttpServer())
          .patch('/users/invalid-id/password')
          .send({
            current: currentPassword,
            new: 'NextPassword123!',
            confirm: 'NextPassword123!',
          })
          .expect(400);
      });

      it('should return 400 when all password fields are invalid', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${createdUserId}/password`)
          .send({
            current: '123',
            new: '123',
            confirm: '123',
          })
          .expect(400);
      });

      it('should return 400 when new and confirm do not match', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${createdUserId}/password`)
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
          .send({
            current: currentPassword,
            new: 'NextPassword123!',
            confirm: 'NextPassword123!',
          })
          .expect(404);
      });

      it('should return 400 when current password is invalid', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${createdUserId}/password`)
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

      it('should update password with valid payload', async () => {
        const nextPassword = 'NextPassword123!';

        await request(app.getHttpServer())
          .patch(`/users/${createdUserId}/password`)
          .send({
            current: currentPassword,
            new: nextPassword,
            confirm: nextPassword,
          })
          .expect(204);

        currentPassword = nextPassword;
      });
    });

    describe('PATCH /users/verify/by-email/:email', () => {
      it('should return 400 when email param format is invalid', async () => {
        await request(app.getHttpServer())
          .patch('/users/verify/by-email/invalid-email')
          .expect(400);
      });

      it('should return 404 when user by email does not exist', async () => {
        await request(app.getHttpServer())
          .patch('/users/verify/by-email/not-found-user@example.com')
          .expect(404);
      });

      it('should verify email and keep user contract sanitized', async () => {
        await request(app.getHttpServer())
          .patch(`/users/verify/by-email/${createUserPayloadBase.email}`)
          .expect(204);

        await request(app.getHttpServer())
          .get(`/users/by-email/${createUserPayloadBase.email}`)
          .expect(200)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            expect(body.id).toBe(createdUserId);
            expect(body.emailVerifiedAt).not.toBeNull();
            expect(body.password).toBeUndefined();
          });
      });
    });
  });
};
