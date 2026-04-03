import { InternalServerErrorException } from '@nestjs/common';
import { UserRoles, UserStatus } from '../constants';
import { Test, type TestingModule } from '@nestjs/testing';
import { PasswordHashService } from '@modules/security/services';
import { PinoLogger } from 'nestjs-pino';
import { UsersRepository } from '../repositories';
import { UsersEventsService } from './users-events.service';
import { UsersCreateService } from './users-create.service';

describe('UsersCreateService', () => {
  let service: UsersCreateService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let usersEventsService: jest.Mocked<Pick<UsersEventsService, 'emitUserCreated'>>;
  let passwordHashService: jest.Mocked<Pick<PasswordHashService, 'hashPassword'>>;
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
      emitUserCreated: jest.fn(),
    };

    passwordHashService = {
      hashPassword: jest.fn(),
    };

    logger = {
      setContext: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersCreateService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: UsersEventsService, useValue: usersEventsService },
        { provide: PasswordHashService, useValue: passwordHashService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<UsersCreateService>(UsersCreateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create user, hash password and emit user created event', async () => {
    passwordHashService.hashPassword.mockResolvedValue('hashed-password');
    usersRepository.create.mockResolvedValue(baseUser as never);

    const payload = {
      email: 'test@example.com',
      password: 'plain-password',
      userName: 'test-user',
    };

    await expect(service.createUser(payload as never)).resolves.toEqual(baseUser);

    expect(passwordHashService.hashPassword).toHaveBeenCalledWith('plain-password');
    expect(usersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: payload.email,
        password: 'hashed-password',
      }),
    );
    expect(usersEventsService.emitUserCreated).toHaveBeenCalledWith(baseUser);
  });

  it('should throw InternalServerErrorException when create fails', async () => {
    passwordHashService.hashPassword.mockResolvedValue('hashed-password');
    usersRepository.create.mockRejectedValue(new Error('db error'));

    await expect(
      service.createUser({
        email: 'test@example.com',
        password: 'plain-password',
        userName: 'test-user',
      } as never),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
