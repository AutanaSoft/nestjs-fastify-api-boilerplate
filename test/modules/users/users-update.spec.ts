import { UserRoles, UserStatus } from '@/modules/users/constants';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { createUserPayloadBase } from '../../utils/test-constants';
import type { UsersE2EContext } from './users.e2e.types';

export const usersUpdateSuite = (
  getApp: () => NestFastifyApplication,
  context: UsersE2EContext,
) => {
  describe('Users Update (e2e)', () => {
    let app: NestFastifyApplication;
    let createdUserId: string;
    let duplicateUserName: string;

    const getAdminToken = (): string => {
      if (!context.adminUser.accessToken) {
        throw new Error('Admin access token is required for users update suite');
      }

      return context.adminUser.accessToken;
    };

    const getRegularToken = (): string => {
      if (!context.regularUser.accessToken) {
        throw new Error('Regular access token is required for users update suite');
      }

      return context.regularUser.accessToken;
    };

    beforeAll(async () => {
      app = getApp();

      if (!context.managedUserId) {
        throw new Error('usersUpdateSuite requires managedUserId from create suite');
      }
      if (!context.regularUser.id) {
        throw new Error('usersUpdateSuite requires regular user id from e2e bootstrap');
      }

      createdUserId = context.managedUserId;

      const duplicateSuffix = randomUUID().slice(0, 4);
      const duplicateUserPayload = {
        ...createUserPayloadBase,
        email: `${duplicateSuffix}-${createUserPayloadBase.email}`,
        userName: `${createUserPayloadBase.userName}-${duplicateSuffix}`,
      };

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send(duplicateUserPayload)
        .expect(201)
        .expect((res) => {
          const body = res.body as Record<string, unknown>;
          context.createdUserIds.push(body.id as string);
          duplicateUserName = duplicateUserPayload.userName;
        });
    });

    describe('PATCH /users/:id', () => {
      it('should return 401 when token is missing', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${createdUserId}`)
          .send({ userName: 'any-value' })
          .expect(401);
      });

      it('should return 403 when requester is not admin', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${createdUserId}`)
          .set('Authorization', `Bearer ${getRegularToken()}`)
          .send({ userName: 'not-allowed' })
          .expect(403);
      });

      it('should return 403 when regular requester updates own user', async () => {
        const updatedSuffix = randomUUID().slice(0, 4);
        const updatedUserName = `owner-${updatedSuffix}`;

        await request(app.getHttpServer())
          .patch(`/users/${context.regularUser.id}`)
          .set('Authorization', `Bearer ${getRegularToken()}`)
          .send({ userName: updatedUserName })
          .expect(403);
      });

      it('should return 400 when id is not a valid uuid', async () => {
        await request(app.getHttpServer())
          .patch('/users/invalid-id')
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .send({ userName: 'valid-user-name' })
          .expect(400);
      });

      it('should return 400 when update payload is empty', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${createdUserId}`)
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .send({})
          .expect(400);
      });

      it('should return 400 when userName is invalid', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${createdUserId}`)
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .send({ userName: 'a' })
          .expect(400);
      });

      it('should return 400 when role is invalid', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${createdUserId}`)
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .send({ role: 'INVALID_ROLE' })
          .expect(400);
      });

      it('should return 400 when status is invalid', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${createdUserId}`)
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .send({ status: 'INVALID_STATUS' })
          .expect(400);
      });

      it('should return 404 when user does not exist', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${randomUUID()}`)
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .send({ userName: 'valid-updated-name' })
          .expect(404);
      });

      it('should return 409 when userName is already in use', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${createdUserId}`)
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .send({ userName: duplicateUserName })
          .expect(409)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            const error = body.error as Record<string, unknown>;
            expect(error.message).toBe('Email or userName is already in use');
          });
      });

      it('should update user with valid payload for admin', async () => {
        const updatedSuffix = randomUUID().slice(0, 4);
        const updatedUserName = `${createUserPayloadBase.userName}-${updatedSuffix}`;

        await request(app.getHttpServer())
          .patch(`/users/${createdUserId}`)
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .send({ userName: updatedUserName })
          .expect(200)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            expect(body.id).toBe(createdUserId);
            expect(body.userName).toBe(updatedUserName);
            expect(body.password).toBeUndefined();
          });
      });

      it('should update user role for admin', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${createdUserId}`)
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .send({ role: UserRoles.ADMIN })
          .expect(200)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            expect(body.id).toBe(createdUserId);
            expect(body.role).toBe(UserRoles.ADMIN);
            expect(body.password).toBeUndefined();
          });
      });

      it('should update user status for admin', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${createdUserId}`)
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .send({ status: UserStatus.ACTIVE })
          .expect(200)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            expect(body.id).toBe(createdUserId);
            expect(body.status).toBe(UserStatus.ACTIVE);
            expect(body.password).toBeUndefined();
          });
      });

      it('should update user with userName, role and status in one request for admin', async () => {
        const updatedSuffix = randomUUID().slice(0, 4);
        const updatedUserName = `${createUserPayloadBase.userName}-${updatedSuffix}`;

        await request(app.getHttpServer())
          .patch(`/users/${createdUserId}`)
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .send({
            userName: updatedUserName,
            role: UserRoles.GUEST,
            status: UserStatus.FROZEN,
          })
          .expect(200)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            expect(body.id).toBe(createdUserId);
            expect(body.userName).toBe(updatedUserName);
            expect(body.role).toBe(UserRoles.GUEST);
            expect(body.status).toBe(UserStatus.FROZEN);
            expect(body.password).toBeUndefined();
          });
      });
    });
  });
};
