import { InternalServerErrorException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { UserRole, UserStatus } from '@/modules/database/prisma/generated/enums';
import { PinoLogger } from 'nestjs-pino';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

import { hash } from 'bcrypt';
import { UsersRepository } from '../repositories';
import { UsersEventsService } from './users-events.service';
import { UsersWriteService } from './users-write.service';

describe('UsersWriteService', () => {
  let service: UsersWriteService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let usersEventsService: jest.Mocked<Pick<UsersEventsService, 'emitUserCreated'>>;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'error'>>;

  const hashMock = hash as jest.MockedFunction<typeof hash>;

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

    usersEventsService = {
      emitUserCreated: jest.fn(),
    };

    logger = {
      setContext: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersWriteService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: UsersEventsService, useValue: usersEventsService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<UsersWriteService>(UsersWriteService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create user, hash password and emit user created event', async () => {
    hashMock.mockResolvedValue('hashed-password');
    usersRepository.create.mockResolvedValue(baseUser as never);

    const payload = {
      email: 'test@example.com',
      password: 'plain-password',
      userName: 'test-user',
    };

    await expect(service.createUser(payload as never)).resolves.toEqual(baseUser);

    expect(hashMock).toHaveBeenCalledWith('plain-password', 10);
    expect(usersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: payload.email,
        password: 'hashed-password',
      }),
    );
    expect(usersEventsService.emitUserCreated).toHaveBeenCalledWith(baseUser);
  });

  it('should throw InternalServerErrorException when created user fails schema validation', async () => {
    hashMock.mockResolvedValue('hashed-password');
    usersRepository.create.mockResolvedValue({ ...baseUser, email: 'invalid-email' } as never);

    await expect(
      service.createUser({
        email: 'test@example.com',
        password: 'plain-password',
        userName: 'test-user',
      } as never),
    ).rejects.toThrow(InternalServerErrorException);

    expect(logger.error).toHaveBeenCalled();
  });

  it('should throw InternalServerErrorException when create fails', async () => {
    hashMock.mockResolvedValue('hashed-password');
    usersRepository.create.mockRejectedValue(new Error('db error'));

    await expect(
      service.createUser({
        email: 'test@example.com',
        password: 'plain-password',
        userName: 'test-user',
      } as never),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('should update user successfully', async () => {
    usersRepository.updateById.mockResolvedValue(baseUser as never);

    await expect(
      service.updateUser(baseUser.id, {
        userName: 'updated-name',
      } as never),
    ).resolves.toEqual(baseUser);
  });

  it('should throw InternalServerErrorException when update output is invalid', async () => {
    usersRepository.updateById.mockResolvedValue({ ...baseUser, email: 'invalid-email' } as never);

    await expect(
      service.updateUser(baseUser.id, {
        userName: 'updated-name',
      } as never),
    ).rejects.toThrow(InternalServerErrorException);

    expect(logger.error).toHaveBeenCalled();
  });
});
