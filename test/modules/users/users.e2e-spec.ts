import { PrismaService } from '@/modules/database/services/prisma.service';
import { PasswordHashService } from '@/modules/security/services';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { getAppInstance } from '../../utils/test-client';
import { usersCreateSuite } from './users-create.spec';
import { usersMeSuite } from './users-me.spec';
import { usersReadSuite } from './users-read.spec';
import { usersSecuritySuite } from './users-security.spec';
import type { UsersE2EContext } from './users.e2e.types';
import { usersUpdateSuite } from './users-update.spec';

describe('UsersController (e2e)', () => {
  let app: NestFastifyApplication;
  const suffix = randomUUID().replace(/-/g, '').slice(0, 12);
  const userNameSuffix = suffix.slice(0, 8);
  const context: UsersE2EContext = {
    createdUserIds: [],
    adminUser: {
      email: `${suffix}-admin-users@example.com`,
      userName: `adm-${userNameSuffix}`,
      password: 'AdminPass123!',
    },
    regularUser: {
      email: `${suffix}-regular-users@example.com`,
      userName: `usr-${userNameSuffix}`,
      password: 'RegularPass123!',
    },
  };

  beforeAll(async () => {
    app = await getAppInstance();

    const prisma = app.get<PrismaService>(PrismaService);
    const passwordHashService = app.get<PasswordHashService>(PasswordHashService);

    const [adminPasswordHash, regularPasswordHash] = await Promise.all([
      passwordHashService.hashPassword(context.adminUser.password),
      passwordHashService.hashPassword(context.regularUser.password),
    ]);

    const [adminUser, regularUser] = await prisma.$transaction([
      prisma.userDbEntity.create({
        data: {
          email: context.adminUser.email,
          userName: context.adminUser.userName,
          password: adminPasswordHash,
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      }),
      prisma.userDbEntity.create({
        data: {
          email: context.regularUser.email,
          userName: context.regularUser.userName,
          password: regularPasswordHash,
          role: 'USER',
          status: 'ACTIVE',
        },
      }),
    ]);

    context.adminUser.id = adminUser.id;
    context.regularUser.id = regularUser.id;
    context.createdUserIds.push(adminUser.id, regularUser.id);

    const [adminSession, regularSession] = await Promise.all([
      request(app.getHttpServer()).post('/auth/sign-in').send({
        email: context.adminUser.email,
        password: context.adminUser.password,
      }),
      request(app.getHttpServer()).post('/auth/sign-in').send({
        email: context.regularUser.email,
        password: context.regularUser.password,
      }),
    ]);

    if (adminSession.status !== 200 || regularSession.status !== 200) {
      throw new Error('Could not bootstrap users e2e auth sessions');
    }

    context.adminUser.accessToken = (adminSession.body as { accessToken: string }).accessToken;
    context.regularUser.accessToken = (regularSession.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    if (!context.createdUserIds.length) {
      return;
    }

    const prisma = app.get<PrismaService>(PrismaService);

    await prisma.userDbEntity.deleteMany({
      where: {
        id: {
          in: context.createdUserIds,
        },
      },
    });
  });

  usersCreateSuite(() => app, context);
  usersMeSuite(() => app, context);
  usersReadSuite(() => app, context);
  usersUpdateSuite(() => app, context);
  usersSecuritySuite(() => app, context);
});
