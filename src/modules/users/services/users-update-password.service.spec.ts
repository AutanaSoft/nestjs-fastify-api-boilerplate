import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UserRoles, UserStatus } from '../constants';
import { Test, type TestingModule } from '@nestjs/testing';
import { PasswordHashService } from '@modules/security/services';
import { PinoLogger } from 'nestjs-pino';
import { UsersRepository } from '../repositories';
import { UsersEventsService } from './users-events.service';
import { UsersUpdatePasswordService } from './users-update-password.service';

describe('UsersUpdatePasswordService', () => {
  let service: UsersUpdatePasswordService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let usersEventsService: jest.Mocked<Pick<UsersEventsService, 'emitUserPasswordUpdated'>>;
  let passwordHashService: jest.Mocked<
    Pick<PasswordHashService, 'verifyPassword' | 'hashPassword'>
  >;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'error'>>;

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
    usersRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findMany: jest.fn(),
      updateById: jest.fn(),
      updatePassword: jest.fn(),
    };

    usersEventsService = {
      emitUserPasswordUpdated: jest.fn(),
    };

    passwordHashService = {
      verifyPassword: jest.fn(),
      hashPassword: jest.fn(),
    };

    logger = {
      setContext: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersUpdatePasswordService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: UsersEventsService, useValue: usersEventsService },
        { provide: PasswordHashService, useValue: passwordHashService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<UsersUpdatePasswordService>(UsersUpdatePasswordService);
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
    passwordHashService.verifyPassword.mockResolvedValue(false);

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
    passwordHashService.verifyPassword.mockResolvedValue(true);
    passwordHashService.hashPassword.mockResolvedValue('new-hash');
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
    passwordHashService.verifyPassword.mockResolvedValue(true);
    passwordHashService.hashPassword.mockResolvedValue('new-hash');
    usersRepository.updatePassword.mockRejectedValue(new Error('db error'));

    await expect(
      service.updatePassword(baseUser.id, {
        current: 'old',
        new: 'new',
        confirm: 'new',
      } as never),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
