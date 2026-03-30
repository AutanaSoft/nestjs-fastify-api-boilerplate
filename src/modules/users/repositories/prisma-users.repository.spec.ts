import { PrismaService } from '@modules/database/services/prisma.service';
import { Test, type TestingModule } from '@nestjs/testing';
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

  it('should create user', async () => {
    const payload = {
      email: 'test@example.com',
      password: 'hashed',
      userName: 'test-user',
    };

    const created = { id: '550e8400-e29b-41d4-a716-446655440000', ...payload };
    prismaService.userDbEntity.create.mockResolvedValue(created);

    await expect(repository.create(payload as never)).resolves.toEqual(created);
    expect(prismaService.userDbEntity.create).toHaveBeenCalledWith({ data: payload });
  });

  it('should find user by id', async () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const user = { id, email: 'test@example.com' };
    prismaService.userDbEntity.findUnique.mockResolvedValue(user);

    await expect(repository.findById(id)).resolves.toEqual(user);
    expect(prismaService.userDbEntity.findUnique).toHaveBeenCalledWith({ where: { id } });
  });

  it('should find user by email', async () => {
    const email = 'test@example.com';
    const user = { id: '550e8400-e29b-41d4-a716-446655440000', email };
    prismaService.userDbEntity.findUnique.mockResolvedValue(user);

    await expect(repository.findByEmail(email)).resolves.toEqual(user);
    expect(prismaService.userDbEntity.findUnique).toHaveBeenCalledWith({ where: { email } });
  });

  it('should list users with filters using transaction', async () => {
    const filters = {
      skip: 10,
      take: 5,
      role: 'USER',
      status: 'ACTIVE',
      verified: true,
      email: 'foo',
      userName: 'bar',
    };

    const data = [{ id: '550e8400-e29b-41d4-a716-446655440000', email: 'foo@example.com' }];
    prismaService.$transaction.mockResolvedValue([data, 13]);

    await expect(repository.findMany(filters as never)).resolves.toEqual({ data, total: 13 });

    expect(prismaService.userDbEntity.findMany).toHaveBeenCalledWith({
      where: {
        role: 'USER',
        status: 'ACTIVE',
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
        role: 'USER',
        status: 'ACTIVE',
        emailVerifiedAt: { not: null },
        email: { contains: 'foo', mode: 'insensitive' },
        userName: { contains: 'bar', mode: 'insensitive' },
      },
    });
  });

  it('should update user by id', async () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const payload = { userName: 'updated' };
    const updated = { id, email: 'test@example.com', ...payload };

    prismaService.userDbEntity.update.mockResolvedValue(updated);

    await expect(repository.updateById(id, payload as never)).resolves.toEqual(updated);
    expect(prismaService.userDbEntity.update).toHaveBeenCalledWith({
      where: { id },
      data: payload,
    });
  });

  it('should update password', async () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const password = 'new-hash';
    const updated = { id, password };

    prismaService.userDbEntity.update.mockResolvedValue(updated);

    await expect(repository.updatePassword(id, password)).resolves.toEqual(updated);
    expect(prismaService.userDbEntity.update).toHaveBeenCalledWith({
      where: { id },
      data: { password },
    });
  });

  it('should verify email', async () => {
    const email = 'test@example.com';
    const verifiedAt = new Date('2026-03-29T00:00:00.000Z');
    const updated = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email,
      emailVerifiedAt: verifiedAt,
    };

    prismaService.userDbEntity.update.mockResolvedValue(updated);

    await expect(repository.verifyEmail(email, verifiedAt)).resolves.toEqual(updated);
    expect(prismaService.userDbEntity.update).toHaveBeenCalledWith({
      where: { email },
      data: { emailVerifiedAt: verifiedAt },
    });
  });
});
