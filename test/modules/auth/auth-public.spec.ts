import { PrismaService } from '@/modules/database/services/prisma.service';
import { PasswordHashService } from '@/modules/security/services';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { authSignUpPayloadBase } from '../../utils/test-constants';
import type { AuthE2EContext } from './auth.e2e.types';

export const authPublicSuite = (getApp: () => NestFastifyApplication, context: AuthE2EContext) => {
  describe('Auth Public Routes (e2e)', () => {
    let app: NestFastifyApplication;
    let prisma: PrismaService;
    let passwordHashService: PasswordHashService;

    beforeAll(async () => {
      app = getApp();
      prisma = app.get<PrismaService>(PrismaService);
      passwordHashService = app.get<PasswordHashService>(PasswordHashService);

      await prisma.userDbEntity.deleteMany({
        where: {
          OR: [
            { email: context.primaryUser.email },
            { userName: context.primaryUser.userName },
            { email: context.bannedUser.email },
            { userName: context.bannedUser.userName },
          ],
        },
      });

      const bannedPasswordHash = await passwordHashService.hashPassword(
        context.bannedUser.password,
      );
      const bannedUser = await prisma.userDbEntity.create({
        data: {
          email: context.bannedUser.email,
          userName: context.bannedUser.userName,
          password: bannedPasswordHash,
          status: 'BANNED',
        },
      });

      context.bannedUser.id = bannedUser.id;
      context.createdUserIds.push(bannedUser.id);
    });

    describe('POST /auth/sign-up', () => {
      it('should return 400 when payload is invalid', async () => {
        const invalidPayload = {
          ...authSignUpPayloadBase,
          email: 'invalid-email',
          userName: 'a',
          password: '123',
        };

        await request(app.getHttpServer()).post('/auth/sign-up').send(invalidPayload).expect(400);
      });

      it('should create session when payload is valid', async () => {
        const validPayload = {
          ...authSignUpPayloadBase,
          email: context.primaryUser.email,
          userName: context.primaryUser.userName,
          password: context.primaryUser.password,
        };

        await request(app.getHttpServer())
          .post('/auth/sign-up')
          .send(validPayload)
          .expect(201)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;

            expect(typeof body.accessToken).toBe('string');
            expect(typeof body.refreshToken).toBe('string');
            expect(typeof body.createdAt).toBe('string');
            expect(typeof body.expiredAt).toBe('string');

            context.activeSession = {
              accessToken: body.accessToken as string,
              refreshToken: body.refreshToken as string,
            };
          });

        const createdUser = await prisma.userDbEntity.findUnique({
          where: { email: context.primaryUser.email },
        });

        if (!createdUser) {
          throw new Error('Primary auth user was not persisted');
        }

        context.primaryUser.id = createdUser.id;
        context.createdUserIds.push(createdUser.id);
      });

      it('should return 409 when email is duplicated', async () => {
        const duplicateEmailPayload = {
          ...authSignUpPayloadBase,
          email: context.primaryUser.email,
          userName: `dup-${context.primaryUser.userName.slice(0, 8)}`,
          password: context.primaryUser.password,
        };

        await request(app.getHttpServer())
          .post('/auth/sign-up')
          .send(duplicateEmailPayload)
          .expect(409);
      });
    });

    describe('POST /auth/sign-in', () => {
      it('should sign in with valid email and password', async () => {
        await request(app.getHttpServer())
          .post('/auth/sign-in')
          .send({
            email: context.primaryUser.email,
            password: context.primaryUser.password,
          })
          .expect(200)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;

            expect(typeof body.accessToken).toBe('string');
            expect(typeof body.refreshToken).toBe('string');
            context.activeSession = {
              accessToken: body.accessToken as string,
              refreshToken: body.refreshToken as string,
            };
          });
      });

      it('should return 401 for invalid credentials', async () => {
        await request(app.getHttpServer())
          .post('/auth/sign-in')
          .send({
            email: context.primaryUser.email,
            password: 'BadPass123_',
          })
          .expect(401);
      });

      it('should return 403 for banned user', async () => {
        await request(app.getHttpServer())
          .post('/auth/sign-in')
          .send({
            email: context.bannedUser.email,
            password: context.bannedUser.password,
          })
          .expect(403);
      });
    });

    describe('POST /auth/refresh', () => {
      it('should rotate tokens when refresh token is valid', async () => {
        if (!context.activeSession) {
          throw new Error('Active session is required before refresh test');
        }

        await request(app.getHttpServer())
          .post('/auth/refresh')
          .send({
            refreshToken: context.activeSession.refreshToken,
          })
          .expect(200)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;

            expect(typeof body.accessToken).toBe('string');
            expect(typeof body.refreshToken).toBe('string');
          });
      });

      it('should return 401 when refresh token is invalid', async () => {
        await request(app.getHttpServer())
          .post('/auth/refresh')
          .send({
            refreshToken: 'invalid-refresh-token',
          })
          .expect(401);
      });
    });
  });
};
