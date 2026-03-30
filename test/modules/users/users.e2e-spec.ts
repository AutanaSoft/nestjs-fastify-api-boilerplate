import { PrismaService } from '@/modules/database/services/prisma.service';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { getAppInstance } from '../../utils/test-client';
import { usersCreateSuite } from './users-create.spec';
import { usersReadSuite } from './users-read.spec';
import { usersSecuritySuite } from './users-security.spec';
import type { UsersE2EContext } from './users.e2e.types';
import { usersUpdateSuite } from './users-update.spec';

describe('UsersController (e2e)', () => {
  let app: NestFastifyApplication;
  const context: UsersE2EContext = {
    createdUserIds: [],
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

  usersCreateSuite(() => app, context);
  usersReadSuite(() => app, context);
  usersUpdateSuite(() => app, context);
  usersSecuritySuite(() => app, context);
});
