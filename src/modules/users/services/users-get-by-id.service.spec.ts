import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UserRoles, UserStatus } from '../constants';
import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { UsersRepository } from '../repositories';
import { UsersGetByIdService } from './users-get-by-id.service';

describe('UsersGetByIdService', () => {
  let service: UsersGetByIdService;
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
        UsersGetByIdService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<UsersGetByIdService>(UsersGetByIdService);
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
});
