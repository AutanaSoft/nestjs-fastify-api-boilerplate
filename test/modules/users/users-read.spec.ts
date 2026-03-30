import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { UserRole, UserStatus } from '@/modules/database/prisma/generated/enums';
import { createUserPayloadBase } from '../../utils/test-constants';
import type { UsersE2EContext } from './users.e2e.types';

export const usersReadSuite = (getApp: () => NestFastifyApplication, context: UsersE2EContext) => {
  describe('Users Read (e2e)', () => {
    let app: NestFastifyApplication;
    let createdUserId: string;
    let verifiedAdminUserEmail: string;
    let unverifiedGuestUserEmail: string;

    beforeAll(async () => {
      app = getApp();

      const [firstCreatedUserId] = context.createdUserIds;
      if (!firstCreatedUserId) {
        throw new Error('usersReadSuite requires a created user id in context');
      }

      createdUserId = firstCreatedUserId;

      const verifiedSuffix = randomUUID().slice(0, 4);
      verifiedAdminUserEmail = `${verifiedSuffix}-admin-${createUserPayloadBase.email}`;

      await request(app.getHttpServer())
        .post('/users')
        .send({
          ...createUserPayloadBase,
          email: verifiedAdminUserEmail,
          userName: `admin-${verifiedSuffix}`,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as Record<string, unknown>;
          context.createdUserIds.push(body.id as string);
        });

      await request(app.getHttpServer())
        .patch(`/users/verify/by-email/${verifiedAdminUserEmail}`)
        .expect(204);

      const unverifiedSuffix = randomUUID().slice(0, 4);
      unverifiedGuestUserEmail = `${unverifiedSuffix}-guest-${createUserPayloadBase.email}`;

      await request(app.getHttpServer())
        .post('/users')
        .send({
          ...createUserPayloadBase,
          email: unverifiedGuestUserEmail,
          userName: `guest-${unverifiedSuffix}`,
          role: UserRole.GUEST,
          status: UserStatus.FROZEN,
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as Record<string, unknown>;
          context.createdUserIds.push(body.id as string);
        });
    });

    describe('GET /users/by-email/:email', () => {
      it('should return user by email', async () => {
        await request(app.getHttpServer())
          .get(`/users/by-email/${createUserPayloadBase.email}`)
          .expect(200)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            expect(body.id).toBe(createdUserId);
            expect(body.email).toBe(createUserPayloadBase.email);
            expect(body.password).toBeUndefined();
          });
      });

      it('should return 400 when email param format is invalid', async () => {
        await request(app.getHttpServer()).get('/users/by-email/invalid-email').expect(400);
      });

      it('should return 404 when user by email does not exist', async () => {
        await request(app.getHttpServer())
          .get('/users/by-email/not-found-user@example.com')
          .expect(404)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            const error = body.error as Record<string, unknown>;
            expect(error.message).toBe('User not found');
          });
      });
    });

    describe('GET /users/:id', () => {
      it('should return user by id', async () => {
        await request(app.getHttpServer())
          .get(`/users/${createdUserId}`)
          .expect(200)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            expect(body.id).toBe(createdUserId);
            expect(body.email).toBe(createUserPayloadBase.email);
            expect(body.password).toBeUndefined();
          });
      });

      it('should return 400 when id is not a valid uuid', async () => {
        await request(app.getHttpServer()).get('/users/invalid-id').expect(400);
      });

      it('should return 404 when user id does not exist', async () => {
        await request(app.getHttpServer())
          .get(`/users/${randomUUID()}`)
          .expect(404)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            const error = body.error as Record<string, unknown>;
            expect(error.message).toBe('User not found');
          });
      });
    });

    describe('GET /users', () => {
      it('should return paginated users response', async () => {
        await request(app.getHttpServer())
          .get('/users?skip=0&take=10')
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
        await request(app.getHttpServer()).get('/users?skip=0&take=101').expect(400);
      });

      it('should return 400 when take is zero', async () => {
        await request(app.getHttpServer()).get('/users?skip=0&take=0').expect(400);
      });

      it('should return 400 when skip is negative', async () => {
        await request(app.getHttpServer()).get('/users?skip=-1&take=10').expect(400);
      });

      it('should return 400 when email query filter is invalid', async () => {
        await request(app.getHttpServer())
          .get('/users?skip=0&take=10&email=invalid-email')
          .expect(400);
      });

      it('should return 400 when userName query filter is invalid', async () => {
        await request(app.getHttpServer()).get('/users?skip=0&take=10&userName=a').expect(400);
      });

      it('should return 400 when role query filter is invalid', async () => {
        await request(app.getHttpServer())
          .get('/users?skip=0&take=10&role=INVALID_ROLE')
          .expect(400);
      });

      it('should return 400 when status query filter is invalid', async () => {
        await request(app.getHttpServer())
          .get('/users?skip=0&take=10&status=INVALID_STATUS')
          .expect(400);
      });

      it('should filter users by role', async () => {
        await request(app.getHttpServer())
          .get(`/users?skip=0&take=10&role=${UserRole.ADMIN}&email=${verifiedAdminUserEmail}`)
          .expect(200)
          .expect((res) => {
            const body = res.body as Record<string, unknown>;
            const data = body.data as Array<Record<string, unknown>>;
            expect(data.length).toBeGreaterThan(0);
            expect(data.every((user) => user.role === UserRole.ADMIN)).toBe(true);
            expect(data.some((user) => user.email === verifiedAdminUserEmail)).toBe(true);
          });
      });

      it('should filter users by status', async () => {
        await request(app.getHttpServer())
          .get(
            `/users?skip=0&take=10&status=${UserStatus.FROZEN}&email=${unverifiedGuestUserEmail}`,
          )
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
