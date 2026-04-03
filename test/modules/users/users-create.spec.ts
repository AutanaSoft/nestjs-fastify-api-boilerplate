import { PrismaService } from '@/modules/database/services/prisma.service';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { createUserPayloadBase } from '../../utils/test-constants';
import type { UsersE2EContext } from './users.e2e.types';

export const usersCreateSuite = (
  getApp: () => NestFastifyApplication,
  context: UsersE2EContext,
) => {
  describe('POST /users', () => {
    let app: NestFastifyApplication;

    const getAdminToken = (): string => {
      if (!context.adminUser.accessToken) {
        throw new Error('Admin access token is required for users create suite');
      }

      return context.adminUser.accessToken;
    };

    const getRegularToken = (): string => {
      if (!context.regularUser.accessToken) {
        throw new Error('Regular access token is required for users create suite');
      }

      return context.regularUser.accessToken;
    };

    beforeAll(async () => {
      app = getApp();

      const prisma = app.get<PrismaService>(PrismaService);
      await prisma.userDbEntity.deleteMany({
        where: {
          OR: [
            { email: createUserPayloadBase.email },
            { userName: createUserPayloadBase.userName },
          ],
        },
      });
    });

    it('should return 401 when token is missing', async () => {
      await request(app.getHttpServer()).post('/users').send(createUserPayloadBase).expect(401);
    });

    it('should return 403 when requester is not admin', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${getRegularToken()}`)
        .send(createUserPayloadBase)
        .expect(403);
    });

    it('should return 400 when all payload fields are invalid', async () => {
      const invalidPayload = {
        ...createUserPayloadBase,
        email: 'invalid-email',
        password: '123',
        userName: 'a',
      };

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send(invalidPayload)
        .expect(400);
    });

    it('should return 400 when only email is invalid', async () => {
      const invalidPayload = {
        ...createUserPayloadBase,
        email: 'invalid-email',
      };

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send(invalidPayload)
        .expect(400);
    });

    it('should return 400 when only userName is invalid', async () => {
      const invalidPayload = {
        ...createUserPayloadBase,
        userName: 'a',
      };

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send(invalidPayload)
        .expect(400);
    });

    it('should return 400 when only password is invalid', async () => {
      const invalidPayload = {
        ...createUserPayloadBase,
        password: '123',
      };

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send(invalidPayload)
        .expect(400);
    });

    it('should return 400 when email is missing', async () => {
      const { email: _email, ...payloadWithoutEmail } = createUserPayloadBase;
      void _email;

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send(payloadWithoutEmail)
        .expect(400);
    });

    it('should return 400 when userName is missing', async () => {
      const { userName: _userName, ...payloadWithoutUserName } = createUserPayloadBase;
      void _userName;

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send(payloadWithoutUserName)
        .expect(400);
    });

    it('should return 400 when password is missing', async () => {
      const { password: _password, ...payloadWithoutPassword } = createUserPayloadBase;
      void _password;

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send(payloadWithoutPassword)
        .expect(400);
    });

    it('should create a user with a valid payload when requester is admin', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send(createUserPayloadBase)
        .expect(201)
        .expect((res) => {
          const body = res.body as Record<string, unknown>;
          expect(typeof body.id).toBe('string');
          expect(body.email).toBe(createUserPayloadBase.email);
          expect(body.userName).toBe(createUserPayloadBase.userName);

          const createdId = body.id as string;
          context.createdUserIds.push(createdId);
          context.managedUserId = createdId;
        });
    });

    it('should return 409 when creating another user with duplicated email', async () => {
      const duplicatedEmailPayload = {
        ...createUserPayloadBase,
        userName: `${createUserPayloadBase.userName}-duplicate`,
      };

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send(duplicatedEmailPayload)
        .expect(409)
        .expect((res) => {
          const body = res.body as Record<string, unknown>;
          const error = body.error as Record<string, unknown>;
          expect(error.message).toBe('Email or userName is already in use');
        });
    });

    it('should return 409 when creating another user with duplicated userName', async () => {
      const duplicatedUserNamePayload = {
        ...createUserPayloadBase,
        email: `other-${createUserPayloadBase.email}`,
      };

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send(duplicatedUserNamePayload)
        .expect(409)
        .expect((res) => {
          const body = res.body as Record<string, unknown>;
          const error = body.error as Record<string, unknown>;
          expect(error.message).toBe('Email or userName is already in use');
        });
    });
  });
};
