import { PrismaService } from '@modules/database/services/prisma.service';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  AuthContractValidationError,
  AuthPersistenceNotFoundError,
  AuthPersistenceUnexpectedError,
  AuthPersistenceUniqueConstraintError,
} from '../errors';
import { PrismaAuthRepository } from './prisma-auth.repository';

describe('PrismaAuthRepository', () => {
  let repository: PrismaAuthRepository;
  let prismaService: {
    userDbEntity: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    authSessionDbEntity: {
      create: jest.Mock;
      findUnique: jest.Mock;
      updateMany: jest.Mock;
    };
    authRefreshTokenDbEntity: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };

  const userEntity = {
    id: '550e8400-e29b-41d4-a716-446655440500',
    email: 'repo-user@example.com',
    userName: 'repo-user',
    password: 'hashed-password',
    role: 'USER',
    status: 'REGISTERED',
    emailVerifiedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    prismaService = {
      userDbEntity: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      authSessionDbEntity: {
        create: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      authRefreshTokenDbEntity: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaAuthRepository,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    repository = module.get<PrismaAuthRepository>(PrismaAuthRepository);
  });

  it('should create user and parse persistence contract', async () => {
    prismaService.userDbEntity.create.mockResolvedValue(userEntity);

    await expect(
      repository.createUser({
        email: userEntity.email,
        userName: userEntity.userName,
        password: userEntity.password,
      }),
    ).resolves.toEqual(userEntity);

    expect(prismaService.userDbEntity.create).toHaveBeenCalledWith({
      data: {
        email: userEntity.email,
        userName: userEntity.userName,
        password: userEntity.password,
      },
    });
  });

  it('should throw AuthContractValidationError when created user does not match schema', async () => {
    prismaService.userDbEntity.create.mockResolvedValue({
      ...userEntity,
      email: 'invalid-email',
    });

    await expect(
      repository.createUser({
        email: userEntity.email,
        userName: userEntity.userName,
        password: userEntity.password,
      }),
    ).rejects.toThrow(AuthContractValidationError);
  });

  it('should map Prisma P2002 to AuthPersistenceUniqueConstraintError', async () => {
    const error = new Error('Unique constraint failed') as Error & { code: string };
    error.code = 'P2002';
    prismaService.userDbEntity.create.mockRejectedValue(error);

    await expect(
      repository.createUser({
        email: userEntity.email,
        userName: userEntity.userName,
        password: userEntity.password,
      }),
    ).rejects.toThrow(AuthPersistenceUniqueConstraintError);
  });

  it('should map Prisma P2025 to AuthPersistenceNotFoundError', async () => {
    const error = new Error('Record not found') as Error & { code: string };
    error.code = 'P2025';
    prismaService.userDbEntity.create.mockRejectedValue(error);

    await expect(
      repository.createUser({
        email: userEntity.email,
        userName: userEntity.userName,
        password: userEntity.password,
      }),
    ).rejects.toThrow(AuthPersistenceNotFoundError);
  });

  it('should map unknown errors to AuthPersistenceUnexpectedError', async () => {
    prismaService.userDbEntity.create.mockRejectedValue(new Error('Unknown database error'));

    await expect(
      repository.createUser({
        email: userEntity.email,
        userName: userEntity.userName,
        password: userEntity.password,
      }),
    ).rejects.toThrow(AuthPersistenceUnexpectedError);
  });

  it('should return null when findUserByEmail does not find record', async () => {
    prismaService.userDbEntity.findUnique.mockResolvedValue(null);

    await expect(repository.findUserByEmail(userEntity.email)).resolves.toBeNull();
  });

  it('should return refresh token aggregate when found by hash', async () => {
    const refreshTokenRecord = {
      id: '550e8400-e29b-41d4-a716-446655440501',
      sessionId: '550e8400-e29b-41d4-a716-446655440502',
      tokenHash: 'sha256-hash',
      expiresAt: new Date('2026-01-07T00:00:00.000Z'),
      revokedAt: null,
      usedAt: null,
      rotatedFromId: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      session: {
        id: '550e8400-e29b-41d4-a716-446655440502',
        userId: userEntity.id,
        revokedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        user: userEntity,
      },
    };

    prismaService.authRefreshTokenDbEntity.findUnique.mockResolvedValue(refreshTokenRecord);

    await expect(repository.findRefreshTokenByHash('sha256-hash')).resolves.toEqual(
      refreshTokenRecord,
    );
    expect(prismaService.authRefreshTokenDbEntity.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: 'sha256-hash' },
      include: {
        session: {
          include: {
            user: true,
          },
        },
      },
    });
  });
});
