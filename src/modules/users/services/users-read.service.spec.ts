import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { UserRole, UserStatus } from '@/modules/database/prisma/generated/enums';
import { PinoLogger } from 'nestjs-pino';
import { UsersRepository } from '../repositories';
import { UsersReadService } from './users-read.service';

describe('UsersReadService', () => {
  let service: UsersReadService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'error'>>;

  const baseUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    userName: 'test-user',
    password: 'hashed-password',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    usersRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findMany: jest.fn(),
      updateById: jest.fn(),
      updatePassword: jest.fn(),
      verifyEmail: jest.fn(),
    };

    logger = {
      setContext: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersReadService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<UsersReadService>(UsersReadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return user by id', async () => {
    usersRepository.findById.mockResolvedValue(baseUser as never);

    await expect(service.getUserById(baseUser.id)).resolves.toEqual(baseUser);
  });

  it('should throw NotFoundException when user by id does not exist', async () => {
    usersRepository.findById.mockResolvedValue(null);

    await expect(service.getUserById(baseUser.id)).rejects.toThrow(NotFoundException);
  });

  it('should throw InternalServerErrorException when findById fails', async () => {
    usersRepository.findById.mockRejectedValue(new Error('db error'));

    await expect(service.getUserById(baseUser.id)).rejects.toThrow(InternalServerErrorException);
  });

  it('should return user by email', async () => {
    usersRepository.findByEmail.mockResolvedValue(baseUser as never);

    await expect(service.getUserByEmail(baseUser.email)).resolves.toEqual(baseUser);
  });

  it('should throw NotFoundException when user by email does not exist', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);

    await expect(service.getUserByEmail(baseUser.email)).rejects.toThrow(NotFoundException);
  });

  it('should return paginated users with computed meta', async () => {
    usersRepository.findMany.mockResolvedValue({
      data: [baseUser],
      total: 11,
    } as never);

    await expect(service.getUsers({ skip: 10, take: 10 } as never)).resolves.toMatchObject({
      data: [
        {
          id: baseUser.id,
          email: baseUser.email,
          userName: baseUser.userName,
        },
      ],
      meta: {
        total: 11,
        count: 1,
        page: 2,
        totalPages: 2,
        start: 10,
        end: 10,
      },
    });
  });

  it('should throw InternalServerErrorException when listed user fails schema validation', async () => {
    usersRepository.findMany.mockResolvedValue({
      data: [{ ...baseUser, email: 'invalid-email' }],
      total: 1,
    } as never);

    await expect(service.getUsers({ skip: 0, take: 10 } as never)).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(logger.error).toHaveBeenCalled();
  });
});
