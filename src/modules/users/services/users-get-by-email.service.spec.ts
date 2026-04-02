import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UserRoles, UserStatus } from '../constants';
import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { UsersRepository } from '../repositories';
import { UsersGetByEmailService } from './users-get-by-email.service';

describe('UsersGetByEmailService', () => {
  let service: UsersGetByEmailService;
  let usersRepository: jest.Mocked<UsersRepository>;
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersGetByEmailService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<UsersGetByEmailService>(UsersGetByEmailService);
  });

  it('should return user by email', async () => {
    usersRepository.findByEmail.mockResolvedValue(baseUser as never);

    await expect(service.getUserByEmail(baseUser.email)).resolves.toEqual(baseUser);
  });

  it('should throw NotFoundException when user by email does not exist', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);

    await expect(service.getUserByEmail(baseUser.email)).rejects.toThrow(NotFoundException);
  });

  it('should throw InternalServerErrorException when findByEmail fails', async () => {
    usersRepository.findByEmail.mockRejectedValue(new Error('db error'));

    await expect(service.getUserByEmail(baseUser.email)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
