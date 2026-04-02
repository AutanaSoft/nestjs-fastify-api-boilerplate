import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { UserRoles, UserStatus } from '@/modules/users/constants';
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

    beforeAll(async () => {
      app = getApp();

      const [firstCreatedUserId] = context.createdUserIds;
      if (!firstCreatedUserId) {
        throw new Error('usersUpdateSuite requires a created user id in context');
      }

      createdUserId = firstCreatedUserId;

      const duplicateSuffix = randomUUID().slice(0, 4);
      const duplicateUserPayload = {
        ...createUserPayloadBase,
        email: `${duplicateSuffix}-${createUserPayloadBase.email}`,
        userName: `${createUserPayloadBase.userName}-${duplicateSuffix}`,
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(duplicateUserPayload)
        .expect(201)
        .expect((res) => {
          const body = res.body as Record<string, unknown>;
          context.createdUserIds.push(body.id as string);
          duplicateUserName = duplicateUserPayload.userName;
        });
    });

    describe('PATCH /users/:id', () => {
      it('should return 400 when id is not a valid uuid', async () => {
        await request(app.getHttpServer())
          .patch('/users/invalid-id')
          .send({ userName: 'valid-user-name' })
          .expect(400);
      });

      it('should return 400 when update payload is empty', async () => {
        await request(app.getHttpServer()).patch(`/users/${createdUserId}`).send({}).expect(400);
      });

      it('should return 400 when userName is invalid', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${createdUserId}`)
          .send({ userName: 'a' })
          .expect(400);
      });

      it('should return 400 when role is invalid', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${createdUserId}`)
          .send({ role: 'INVALID_ROLE' })
          .expect(400);
      });

      it('should return 400 when status is invalid', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${createdUserId}`)
          .send({ status: 'INVALID_STATUS' })
          .expect(400);
      });

      it('should return 404 when user does not exist', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${randomUUID()}`)
          .send({ userName: 'valid-updated-name' })
          .expect(404);
      });

      it('should return 409 when userName is already in use', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${createdUserId}`)
          .send({ userName: duplicateUserName })
          .expect(409)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            const error = body.error as Record<string, unknown>;
            expect(error.message).toBe('Email or userName is already in use');
          });
      });

      it('should update user with valid payload', async () => {
        const updatedSuffix = randomUUID().slice(0, 4);
        const updatedUserName = `${createUserPayloadBase.userName}-${updatedSuffix}`;

        await request(app.getHttpServer())
          .patch(`/users/${createdUserId}`)
          .send({ userName: updatedUserName })
          .expect(200)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            expect(body.id).toBe(createdUserId);
            expect(body.userName).toBe(updatedUserName);
            expect(body.password).toBeUndefined();
          });
      });

      it('should update user role', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${createdUserId}`)
          .send({ role: UserRoles.ADMIN })
          .expect(200)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            expect(body.id).toBe(createdUserId);
            expect(body.role).toBe(UserRoles.ADMIN);
            expect(body.password).toBeUndefined();
          });
      });

      it('should update user status', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${createdUserId}`)
          .send({ status: UserStatus.ACTIVE })
          .expect(200)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            expect(body.id).toBe(createdUserId);
            expect(body.status).toBe(UserStatus.ACTIVE);
            expect(body.password).toBeUndefined();
          });
      });

      it('should update user with userName, role and status in one request', async () => {
        const updatedSuffix = randomUUID().slice(0, 4);
        const updatedUserName = `${createUserPayloadBase.userName}-${updatedSuffix}`;

        await request(app.getHttpServer())
          .patch(`/users/${createdUserId}`)
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
