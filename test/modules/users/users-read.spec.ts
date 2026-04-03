import { PrismaService } from '@/modules/database/services/prisma.service';
import { UserRoles, UserStatus } from '@/modules/users/constants';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { createUserPayloadBase } from '../../utils/test-constants';
import type { UsersE2EContext } from './users.e2e.types';

export const usersReadSuite = (getApp: () => NestFastifyApplication, context: UsersE2EContext) => {
  describe('Users Read (e2e)', () => {
    let app: NestFastifyApplication;
    let createdUserId: string;
    let verifiedAdminUserEmail: string;
    let unverifiedGuestUserEmail: string;

    const getAdminToken = (): string => {
      if (!context.adminUser.accessToken) {
        throw new Error('Admin access token is required for users read suite');
      }

      return context.adminUser.accessToken;
    };

    const getRegularToken = (): string => {
      if (!context.regularUser.accessToken) {
        throw new Error('Regular access token is required for users read suite');
      }

      return context.regularUser.accessToken;
    };

    beforeAll(async () => {
      app = getApp();
      const prisma = app.get<PrismaService>(PrismaService);

      if (!context.managedUserId) {
        throw new Error('usersReadSuite requires managedUserId from create suite');
      }
      if (!context.regularUser.id) {
        throw new Error('usersReadSuite requires regular user id from e2e bootstrap');
      }

      createdUserId = context.managedUserId;

      const verifiedSuffix = randomUUID().slice(0, 4);
      verifiedAdminUserEmail = `${verifiedSuffix}-admin-${createUserPayloadBase.email}`;

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send({
          ...createUserPayloadBase,
          email: verifiedAdminUserEmail,
          userName: `admin-${verifiedSuffix}`,
          role: UserRoles.ADMIN,
          status: UserStatus.ACTIVE,
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as Record<string, unknown>;
          context.createdUserIds.push(body.id as string);
        });

      await prisma.userDbEntity.update({
        where: { email: verifiedAdminUserEmail },
        data: { emailVerifiedAt: new Date() },
      });

      const unverifiedSuffix = randomUUID().slice(0, 4);
      unverifiedGuestUserEmail = `${unverifiedSuffix}-guest-${createUserPayloadBase.email}`;

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${getAdminToken()}`)
        .send({
          ...createUserPayloadBase,
          email: unverifiedGuestUserEmail,
          userName: `guest-${unverifiedSuffix}`,
          role: UserRoles.GUEST,
          status: UserStatus.FROZEN,
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as Record<string, unknown>;
          context.createdUserIds.push(body.id as string);
        });
    });

    describe('GET /users/by-email/:email', () => {
      it('should return 401 when token is missing', async () => {
        await request(app.getHttpServer())
          .get(`/users/by-email/${createUserPayloadBase.email}`)
          .expect(401);
      });

      it('should return 403 when requester is not admin', async () => {
        await request(app.getHttpServer())
          .get(`/users/by-email/${createUserPayloadBase.email}`)
          .set('Authorization', `Bearer ${getRegularToken()}`)
          .expect(403);
      });

      it('should return user by email for admin', async () => {
        await request(app.getHttpServer())
          .get(`/users/by-email/${createUserPayloadBase.email}`)
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .expect(200)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            expect(body.id).toBe(createdUserId);
            expect(body.email).toBe(createUserPayloadBase.email);
            expect(body.password).toBeUndefined();
          });
      });

      it('should return 400 when email param format is invalid', async () => {
        await request(app.getHttpServer())
          .get('/users/by-email/invalid-email')
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .expect(400);
      });

      it('should return 404 when user by email does not exist', async () => {
        await request(app.getHttpServer())
          .get('/users/by-email/not-found-user@example.com')
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .expect(404)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            const error = body.error as Record<string, unknown>;
            expect(error.message).toBe('User not found');
          });
      });
    });

    describe('GET /users/:id', () => {
      it('should return 401 when token is missing', async () => {
        await request(app.getHttpServer()).get(`/users/${createdUserId}`).expect(401);
      });

      it('should return user by id for admin', async () => {
        await request(app.getHttpServer())
          .get(`/users/${createdUserId}`)
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .expect(200)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            expect(body.id).toBe(createdUserId);
            expect(body.email).toBe(createUserPayloadBase.email);
            expect(body.password).toBeUndefined();
          });
      });

      it('should return 403 when requester is a regular user', async () => {
        await request(app.getHttpServer())
          .get(`/users/${context.regularUser.id}`)
          .set('Authorization', `Bearer ${getRegularToken()}`)
          .expect(403);
      });

      it('should return 403 when requester is not admin', async () => {
        await request(app.getHttpServer())
          .get(`/users/${createdUserId}`)
          .set('Authorization', `Bearer ${getRegularToken()}`)
          .expect(403);
      });

      it('should return 400 when id is not a valid uuid', async () => {
        await request(app.getHttpServer())
          .get('/users/invalid-id')
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .expect(400);
      });

      it('should return 404 when user id does not exist', async () => {
        await request(app.getHttpServer())
          .get(`/users/${randomUUID()}`)
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .expect(404)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            const error = body.error as Record<string, unknown>;
            expect(error.message).toBe('User not found');
          });
      });
    });

    describe('GET /users', () => {
      it('should return 401 when token is missing', async () => {
        await request(app.getHttpServer()).get('/users?skip=0&take=10').expect(401);
      });

      it('should return 403 when requester is not admin', async () => {
        await request(app.getHttpServer())
          .get('/users?skip=0&take=10')
          .set('Authorization', `Bearer ${getRegularToken()}`)
          .expect(403);
      });

      it('should return paginated users response for admin', async () => {
        await request(app.getHttpServer())
          .get('/users?skip=0&take=10')
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .expect(200)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            expect(Array.isArray(body.data)).toBe(true);
            expect(body.meta).toBeDefined();

            const data = body.data as Array<Record<string, unknown>>;
            const found = data.find((user) => user.id === createdUserId);
            expect(found).toBeDefined();
            expect(found?.password).toBeUndefined();

            const meta = body.meta as Record<string, unknown>;
            expect(typeof meta.total).toBe('number');
            expect(typeof meta.count).toBe('number');
            expect(typeof meta.page).toBe('number');
            expect(typeof meta.totalPages).toBe('number');
            expect(typeof meta.start).toBe('number');
            expect(typeof meta.end).toBe('number');
          });
      });

      it('should return 400 when take exceeds max allowed value', async () => {
        await request(app.getHttpServer())
          .get('/users?skip=0&take=101')
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .expect(400);
      });

      it('should return 400 when take is zero', async () => {
        await request(app.getHttpServer())
          .get('/users?skip=0&take=0')
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .expect(400);
      });

      it('should return 400 when skip is negative', async () => {
        await request(app.getHttpServer())
          .get('/users?skip=-1&take=10')
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .expect(400);
      });

      it('should return 400 when email query filter is invalid', async () => {
        await request(app.getHttpServer())
          .get('/users?skip=0&take=10&email=invalid-email')
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .expect(400);
      });

      it('should return 400 when userName query filter is invalid', async () => {
        await request(app.getHttpServer())
          .get('/users?skip=0&take=10&userName=a')
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .expect(400);
      });

      it('should return 400 when role query filter is invalid', async () => {
        await request(app.getHttpServer())
          .get('/users?skip=0&take=10&role=INVALID_ROLE')
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .expect(400);
      });

      it('should return 400 when status query filter is invalid', async () => {
        await request(app.getHttpServer())
          .get('/users?skip=0&take=10&status=INVALID_STATUS')
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .expect(400);
      });

      it('should filter users by role', async () => {
        await request(app.getHttpServer())
          .get(`/users?skip=0&take=10&role=${UserRoles.ADMIN}&email=${verifiedAdminUserEmail}`)
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .expect(200)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            const data = body.data as Array<Record<string, unknown>>;
            expect(data.length).toBeGreaterThan(0);
            expect(data.every((user) => user.role === UserRoles.ADMIN)).toBe(true);
            expect(data.some((user) => user.email === verifiedAdminUserEmail)).toBe(true);
          });
      });

      it('should filter users by status', async () => {
        await request(app.getHttpServer())
          .get(
            `/users?skip=0&take=10&status=${UserStatus.FROZEN}&email=${unverifiedGuestUserEmail}`,
          )
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .expect(200)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            const data = body.data as Array<Record<string, unknown>>;
            expect(data.length).toBeGreaterThan(0);
            expect(data.every((user) => user.status === UserStatus.FROZEN)).toBe(true);
            expect(data.some((user) => user.email === unverifiedGuestUserEmail)).toBe(true);
          });
      });

      it('should filter users by verified=true', async () => {
        await request(app.getHttpServer())
          .get(`/users?skip=0&take=10&verified=true&email=${verifiedAdminUserEmail}`)
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .expect(200)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            const data = body.data as Array<Record<string, unknown>>;
            expect(data.length).toBeGreaterThan(0);
            expect(
              data.every(
                (user) => user.emailVerifiedAt !== null && user.emailVerifiedAt !== undefined,
              ),
            ).toBe(true);
            expect(data.some((user) => user.email === verifiedAdminUserEmail)).toBe(true);
          });
      });

      it('should filter users by verified=false', async () => {
        await request(app.getHttpServer())
          .get(`/users?skip=0&take=10&verified=false&email=${unverifiedGuestUserEmail}`)
          .set('Authorization', `Bearer ${getAdminToken()}`)
          .expect(200)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            const data = body.data as Array<Record<string, unknown>>;
            expect(data.length).toBeGreaterThan(0);
            expect(data.every((user) => user.emailVerifiedAt === null)).toBe(true);
            expect(data.some((user) => user.email === unverifiedGuestUserEmail)).toBe(true);
          });
      });
    });
  });
};
