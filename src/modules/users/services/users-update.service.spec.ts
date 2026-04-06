import { InternalServerErrorException } from '@nestjs/common';
import { UserRoles, UserStatus } from '../constants';
import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { UsersRepository } from '../repositories';
import { UsersEventsService } from './users-events.service';
import { UsersUpdateService } from './users-update.service';

describe('UsersUpdateService', () => {
  let service: UsersUpdateService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let usersEventsService: jest.Mocked<Pick<UsersEventsService, 'emitUserUpdated'>>;
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

    logger = {
      setContext: jest.fn(),
      error: jest.fn(),
    };

    usersEventsService = {
      emitUserUpdated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersUpdateService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: UsersEventsService, useValue: usersEventsService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<UsersUpdateService>(UsersUpdateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should update user successfully', async () => {
    usersRepository.updateById.mockResolvedValue(baseUser as never);

    await expect(
      service.updateUser(baseUser.id, {
        userName: 'updated-name',
      } as never),
    ).resolves.toEqual(baseUser);
    expect(usersEventsService.emitUserUpdated).toHaveBeenCalledWith(baseUser);
  });

  it('should throw InternalServerErrorException when update fails', async () => {
    usersRepository.updateById.mockRejectedValue(new Error('db error'));

    await expect(
      service.updateUser(baseUser.id, {
        userName: 'updated-name',
      } as never),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
