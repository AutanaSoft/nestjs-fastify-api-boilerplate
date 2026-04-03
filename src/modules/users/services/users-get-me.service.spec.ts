import { Test, type TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { UsersGetByIdService } from './users-get-by-id.service';
import { UsersGetMeService } from './users-get-me.service';

describe('UsersGetMeService', () => {
  let service: UsersGetMeService;
  let usersGetByIdService: jest.Mocked<Pick<UsersGetByIdService, 'getUserById'>>;

  beforeEach(async () => {
    usersGetByIdService = {
      getUserById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersGetMeService,
        { provide: UsersGetByIdService, useValue: usersGetByIdService },
        {
          provide: PinoLogger,
          useValue: {
            setContext: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersGetMeService>(UsersGetMeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should delegate authenticated user retrieval to usersGetByIdService', async () => {
    const user = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'me@example.com',
      userName: 'me-user',
      password: 'hashed-password',
      role: 'USER',
      status: 'ACTIVE',
      emailVerifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    usersGetByIdService.getUserById.mockResolvedValue(user as never);

    await expect(service.getMe(user.id)).resolves.toEqual(user);
    expect(usersGetByIdService.getUserById).toHaveBeenCalledWith(user.id);
  });
});
