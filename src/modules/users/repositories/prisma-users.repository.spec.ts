import { UserRoles, UserStatus } from '@/modules/users/constants';
import { PrismaService } from '@modules/database/services/prisma.service';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  UsersContractValidationError,
  UsersPersistenceNotFoundError,
  UsersPersistenceUniqueConstraintError,
} from '../errors';
import { PrismaUsersRepository } from './prisma-users.repository';

describe('PrismaUsersRepository', () => {
  let repository: PrismaUsersRepository;
  let prismaService: {
    userDbEntity: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const baseUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    userName: 'test-user',
    password: 'hashed-password',
    role: UserRoles.USER,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    prismaService = {
      userDbEntity: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaUsersRepository,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    repository = module.get<PrismaUsersRepository>(PrismaUsersRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should create user and return parsed contract', async () => {
    const payload = {
      email: 'test@example.com',
      password: 'hashed-password',
      userName: 'test-user',
    };

    prismaService.userDbEntity.create.mockResolvedValue(baseUser);

    await expect(repository.create(payload as never)).resolves.toEqual(baseUser);
    expect(prismaService.userDbEntity.create).toHaveBeenCalledWith({ data: payload });
  });

  it('should throw UsersPersistenceUniqueConstraintError when Prisma returns P2002', async () => {
    prismaService.userDbEntity.create.mockRejectedValue(
      Object.assign(new Error('duplicate'), { code: 'P2002' }),
    );

    await expect(repository.create({} as never)).rejects.toBeInstanceOf(
      UsersPersistenceUniqueConstraintError,
    );
  });

  it('should throw UsersContractValidationError when persisted create output is invalid', async () => {
    prismaService.userDbEntity.create.mockResolvedValue({ ...baseUser, email: 'invalid-email' });

    await expect(repository.create({} as never)).rejects.toBeInstanceOf(
      UsersContractValidationError,
    );
  });

  it('should find user by id and return parsed contract', async () => {
    const id = baseUser.id;
    prismaService.userDbEntity.findUnique.mockResolvedValue(baseUser);

    await expect(repository.findById(id)).resolves.toEqual(baseUser);
    expect(prismaService.userDbEntity.findUnique).toHaveBeenCalledWith({ where: { id } });
  });

  it('should return null when findById does not find a record', async () => {
    prismaService.userDbEntity.findUnique.mockResolvedValue(null);

    await expect(repository.findById(baseUser.id)).resolves.toBeNull();
  });

  it('should list users with filters using transaction and return parsed contracts', async () => {
    const filters = {
      skip: 10,
      take: 5,
      role: UserRoles.USER,
      status: UserStatus.ACTIVE,
      verified: true,
      email: 'foo',
      userName: 'bar',
    };

    prismaService.$transaction.mockResolvedValue([[baseUser], 13]);

    await expect(repository.findMany(filters as never)).resolves.toEqual({
      data: [baseUser],
      total: 13,
    });

    expect(prismaService.userDbEntity.findMany).toHaveBeenCalledWith({
      where: {
        role: UserRoles.USER,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: { not: null },
        email: { contains: 'foo', mode: 'insensitive' },
        userName: { contains: 'bar', mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
      skip: 10,
      take: 5,
    });

    expect(prismaService.userDbEntity.count).toHaveBeenCalledWith({
      where: {
        role: UserRoles.USER,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: { not: null },
        email: { contains: 'foo', mode: 'insensitive' },
        userName: { contains: 'bar', mode: 'insensitive' },
      },
    });
  });

  it('should throw UsersContractValidationError when listed record is invalid', async () => {
    prismaService.$transaction.mockResolvedValue([[{ ...baseUser, email: 'invalid-email' }], 1]);

    await expect(repository.findMany({ skip: 0, take: 10 } as never)).rejects.toBeInstanceOf(
      UsersContractValidationError,
    );
  });

  it('should update user by id and return parsed contract', async () => {
    const id = baseUser.id;
    const payload = { userName: 'updated-user' };
    const updatedUser = { ...baseUser, userName: payload.userName };

    prismaService.userDbEntity.update.mockResolvedValue(updatedUser);

    await expect(repository.updateById(id, payload as never)).resolves.toEqual(updatedUser);
    expect(prismaService.userDbEntity.update).toHaveBeenCalledWith({
      where: { id },
      data: payload,
    });
  });

  it('should throw UsersPersistenceNotFoundError when Prisma returns P2025 on update', async () => {
    prismaService.userDbEntity.update.mockRejectedValue(
      Object.assign(new Error('not found'), { code: 'P2025' }),
    );

    await expect(repository.updateById(baseUser.id, {} as never)).rejects.toBeInstanceOf(
      UsersPersistenceNotFoundError,
    );
  });

  it('should update password and return parsed contract', async () => {
    const id = baseUser.id;
    const password = 'new-hash';
    const updatedUser = { ...baseUser, password };

    prismaService.userDbEntity.update.mockResolvedValue(updatedUser);

    await expect(repository.updatePassword(id, password)).resolves.toEqual(updatedUser);
    expect(prismaService.userDbEntity.update).toHaveBeenCalledWith({
      where: { id },
      data: { password },
    });
  });
});
