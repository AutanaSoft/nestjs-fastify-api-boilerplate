import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { UserRole, UserStatus } from '@/modules/database/prisma/generated/enums';
import { PinoLogger } from 'nestjs-pino';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import { compare, hash } from 'bcrypt';
import { UsersRepository } from '../repositories';
import { UsersEventsService } from './users-events.service';
import { UsersSecurityService } from './users-security.service';

describe('UsersSecurityService', () => {
  let service: UsersSecurityService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let usersEventsService: jest.Mocked<
    Pick<UsersEventsService, 'emitUserPasswordUpdated' | 'emitUserEmailVerified'>
  >;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'error'>>;

  const compareMock = compare as jest.MockedFunction<typeof compare>;
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
      emitUserPasswordUpdated: jest.fn(),
      emitUserEmailVerified: jest.fn(),
    };

    logger = {
      setContext: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersSecurityService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: UsersEventsService, useValue: usersEventsService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<UsersSecurityService>(UsersSecurityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw NotFoundException when updating password for non-existent user', async () => {
    usersRepository.findById.mockResolvedValue(null);

    await expect(
      service.updatePassword(baseUser.id, {
        current: 'old',
        new: 'new',
        confirm: 'new',
      } as never),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException when current password is invalid', async () => {
    usersRepository.findById.mockResolvedValue(baseUser as never);
    compareMock.mockResolvedValue(false as never);

    await expect(
      service.updatePassword(baseUser.id, {
        current: 'wrong',
        new: 'new',
        confirm: 'new',
      } as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('should update password and emit event', async () => {
    usersRepository.findById.mockResolvedValue(baseUser as never);
    compareMock.mockResolvedValue(true as never);
    hashMock.mockResolvedValue('new-hash');
    usersRepository.updatePassword.mockResolvedValue({
      ...baseUser,
      password: 'new-hash',
    } as never);

    await expect(
      service.updatePassword(baseUser.id, {
        current: 'old',
        new: 'new',
        confirm: 'new',
      } as never),
    ).resolves.toBeUndefined();

    expect(usersRepository.updatePassword).toHaveBeenCalledWith(baseUser.id, 'new-hash');
    expect(usersEventsService.emitUserPasswordUpdated).toHaveBeenCalled();
  });

  it('should throw InternalServerErrorException when updatePassword persistence fails', async () => {
    usersRepository.findById.mockResolvedValue(baseUser as never);
    compareMock.mockResolvedValue(true as never);
    hashMock.mockResolvedValue('new-hash');
    usersRepository.updatePassword.mockRejectedValue(new Error('db error'));

    await expect(
      service.updatePassword(baseUser.id, {
        current: 'old',
        new: 'new',
        confirm: 'new',
      } as never),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('should verify email and emit event', async () => {
    usersRepository.verifyEmail.mockResolvedValue({
      ...baseUser,
      emailVerifiedAt: new Date('2026-01-02T00:00:00.000Z'),
    } as never);

    await expect(service.verifyEmail(baseUser.email as never)).resolves.toBeUndefined();
    expect(usersEventsService.emitUserEmailVerified).toHaveBeenCalled();
  });

  it('should throw InternalServerErrorException when verifyEmail output is invalid', async () => {
    usersRepository.verifyEmail.mockResolvedValue({ ...baseUser, email: 'invalid-email' } as never);

    await expect(service.verifyEmail(baseUser.email as never)).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(logger.error).toHaveBeenCalled();
  });
});
