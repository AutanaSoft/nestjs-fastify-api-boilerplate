import { PrismaService } from '@/modules/database/services/prisma.service';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { randomUUID } from 'node:crypto';
import { getAppInstance } from '../../utils/test-client';
import { authPublicSuite } from './auth-public.spec';
import { authRecoverySuite } from './auth-recovery.spec';
import { authSessionSuite } from './auth-session.spec';
import type { AuthE2EContext } from './auth.e2e.types';

const buildUniqueSuffix = (): string => randomUUID().replace(/-/g, '').slice(0, 12);

describe('AuthController (e2e)', () => {
  let app: NestFastifyApplication;
  const suffix = buildUniqueSuffix();

  const context: AuthE2EContext = {
    createdUserIds: [],
    primaryUser: {
      email: `${suffix}-auth@example.com`,
      userName: `auth-${suffix}`,
      password: 'Password123_',
    },
    bannedUser: {
      email: `${suffix}-banned@example.com`,
      userName: `banned-${suffix}`,
      password: 'Password123_',
    },
  };

  beforeAll(async () => {
    app = await getAppInstance();
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

  authPublicSuite(() => app, context);
  authSessionSuite(() => app, context);
  authRecoverySuite(() => app, context);
});
