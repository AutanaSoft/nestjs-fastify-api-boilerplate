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

    it('should return 400 when all payload fields are invalid', async () => {
      const invalidPayload = {
        ...createUserPayloadBase,
        email: 'invalid-email',
        password: '123',
        userName: 'a',
      };

      await request(app.getHttpServer()).post('/users').send(invalidPayload).expect(400);
    });

    it('should return 400 when only email is invalid', async () => {
      const invalidPayload = {
        ...createUserPayloadBase,
        email: 'invalid-email',
      };

      await request(app.getHttpServer()).post('/users').send(invalidPayload).expect(400);
    });

    it('should return 400 when only userName is invalid', async () => {
      const invalidPayload = {
        ...createUserPayloadBase,
        userName: 'a',
      };

      await request(app.getHttpServer()).post('/users').send(invalidPayload).expect(400);
    });

    it('should return 400 when only password is invalid', async () => {
      const invalidPayload = {
        ...createUserPayloadBase,
        password: '123',
      };

      await request(app.getHttpServer()).post('/users').send(invalidPayload).expect(400);
    });

    it('should return 400 when email is missing', async () => {
      const { email: _email, ...payloadWithoutEmail } = createUserPayloadBase;
      void _email;

      await request(app.getHttpServer()).post('/users').send(payloadWithoutEmail).expect(400);
    });

    it('should return 400 when userName is missing', async () => {
      const { userName: _userName, ...payloadWithoutUserName } = createUserPayloadBase;
      void _userName;

      await request(app.getHttpServer()).post('/users').send(payloadWithoutUserName).expect(400);
    });

    it('should return 400 when password is missing', async () => {
      const { password: _password, ...payloadWithoutPassword } = createUserPayloadBase;
      void _password;

      await request(app.getHttpServer()).post('/users').send(payloadWithoutPassword).expect(400);
    });

    it('should create a user with a valid payload', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send(createUserPayloadBase)
        .expect(201)
        .expect((res) => {
          const body = res.body as Record<string, unknown>;
          expect(typeof body.id).toBe('string');
          expect(body.email).toBe(createUserPayloadBase.email);
          expect(body.userName).toBe(createUserPayloadBase.userName);

          context.createdUserIds.push(body.id as string);
        });
    });

    it('should return 409 when creating another user with duplicated email', async () => {
      const duplicatedEmailPayload = {
        ...createUserPayloadBase,
        userName: `${createUserPayloadBase.userName}-duplicate`,
      };

      await request(app.getHttpServer())
        .post('/users')
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
