import { InternalServerErrorException } from '@nestjs/common';
import { UserRoles, UserStatus } from '../constants';
import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { UsersRepository } from '../repositories';
import { UsersListService } from './users-list.service';

describe('UsersListService', () => {
  let service: UsersListService;
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
        UsersListService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<UsersListService>(UsersListService);
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
