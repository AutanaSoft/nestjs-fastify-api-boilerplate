import { TokenType } from '@/modules/auth/enum';
import { JwtTokenService } from '@/modules/auth/services';
import { PrismaService } from '@/modules/database/services/prisma.service';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import type { AuthE2EContext } from './auth.e2e.types';

export const authRecoverySuite = (
  getApp: () => NestFastifyApplication,
  context: AuthE2EContext,
) => {
  describe('Auth Recovery Routes (e2e)', () => {
    let app: NestFastifyApplication;
    let prisma: PrismaService;
    let jwtTokenService: JwtTokenService;

    const resolvePrimaryUser = async (): Promise<{
      id: string;
      email: string;
      userName: string;
    }> => {
      const userId = context.primaryUser.id;
      if (userId) {
        const userById = await prisma.userDbEntity.findUnique({
          where: { id: userId },
        });

        if (userById) {
          return {
            id: userById.id,
            email: userById.email,
            userName: userById.userName,
          };
        }
      }

      const userByEmail = await prisma.userDbEntity.findUnique({
        where: { email: context.primaryUser.email },
      });

      if (!userByEmail) {
        throw new Error('Primary auth user is required before recovery suite');
      }

      context.primaryUser.id = userByEmail.id;

      return {
        id: userByEmail.id,
        email: userByEmail.email,
        userName: userByEmail.userName,
      };
    };

    const buildCustomToken = async (purpose: TokenType): Promise<string> => {
      const user = await resolvePrimaryUser();

      return jwtTokenService.signCustomToken({
        userId: user.id,
        email: user.email,
        userName: user.userName,
        purpose,
      });
    };

    beforeAll(() => {
      app = getApp();
      prisma = app.get<PrismaService>(PrismaService);
      jwtTokenService = app.get<JwtTokenService>(JwtTokenService);
    });

    describe('POST /auth/request-email-verification', () => {
      it('should return 204 for unknown email (anti-enumeration)', async () => {
        await request(app.getHttpServer())
          .post('/auth/request-email-verification')
          .send({ email: 'unknown-recovery-user@example.com' })
          .expect(204);
      });

      it('should return 204 for existing email', async () => {
        await request(app.getHttpServer())
          .post('/auth/request-email-verification')
          .send({ email: context.primaryUser.email })
          .expect(204);
      });
    });

    describe('POST /auth/verify-email', () => {
      it('should return 400 for invalid token', async () => {
        await request(app.getHttpServer())
          .post('/auth/verify-email')
          .send({ token: 'invalid-token' })
          .expect(400);
      });

      it('should return 409 when token purpose is invalid', async () => {
        const wrongPurposeToken = await buildCustomToken(TokenType.RESET_PASSWORD);

        await request(app.getHttpServer())
          .post('/auth/verify-email')
          .send({ token: wrongPurposeToken })
          .expect(409);
      });

      it('should verify email with valid token', async () => {
        const validVerifyToken = await buildCustomToken(TokenType.VERIFY_EMAIL);

        await request(app.getHttpServer())
          .post('/auth/verify-email')
          .send({ token: validVerifyToken })
          .expect(204);

        const verifiedUser = await prisma.userDbEntity.findUnique({
          where: { id: context.primaryUser.id },
        });

        expect(verifiedUser?.emailVerifiedAt).not.toBeNull();
      });
    });

    describe('POST /auth/forgot-password', () => {
      it('should return 204 for unknown email (anti-enumeration)', async () => {
        await request(app.getHttpServer())
          .post('/auth/forgot-password')
          .send({ email: 'unknown-reset-user@example.com' })
          .expect(204);
      });

      it('should return 204 for existing email', async () => {
        await request(app.getHttpServer())
          .post('/auth/forgot-password')
          .send({ email: context.primaryUser.email })
          .expect(204);
      });
    });

    describe('POST /auth/reset-password', () => {
      it('should return 400 for invalid token', async () => {
        await request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({
            token: 'invalid-token',
            newPassword: 'Updated123_',
            confirmPassword: 'Updated123_',
          })
          .expect(400);
      });

      it('should return 400 for password mismatch', async () => {
        const token = await buildCustomToken(TokenType.RESET_PASSWORD);

        await request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({
            token,
            newPassword: 'Updated123_',
            confirmPassword: 'Different123_',
          })
          .expect(400);
      });

      it('should return 409 when token purpose is invalid', async () => {
        const wrongPurposeToken = await buildCustomToken(TokenType.VERIFY_EMAIL);

        await request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({
            token: wrongPurposeToken,
            newPassword: 'Updated123_',
            confirmPassword: 'Updated123_',
          })
          .expect(409);
      });

      it('should reset password with valid token and allow sign-in with new password', async () => {
        const validResetToken = await buildCustomToken(TokenType.RESET_PASSWORD);
        const nextPassword = 'Updated123_';

        await request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({
            token: validResetToken,
            newPassword: nextPassword,
            confirmPassword: nextPassword,
          })
          .expect(204);

        await request(app.getHttpServer())
          .post('/auth/sign-in')
          .send({
            email: context.primaryUser.email,
            password: context.primaryUser.password,
          })
          .expect(401);

        await request(app.getHttpServer())
          .post('/auth/sign-in')
          .send({
            email: context.primaryUser.email,
            password: nextPassword,
          })
          .expect(200);

        context.primaryUser.password = nextPassword;
      });
    });
  });
};
