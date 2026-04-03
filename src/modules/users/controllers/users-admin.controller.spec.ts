import { Test, type TestingModule } from '@nestjs/testing';
import {
  UsersCreateService,
  UsersGetByEmailService,
  UsersGetByIdService,
  UsersListService,
  UsersUpdateService,
} from '../services';
import { UsersAdminController } from './users-admin.controller';

describe('UsersAdminController', () => {
  let controller: UsersAdminController;
  let usersCreateService: jest.Mocked<Pick<UsersCreateService, 'createUser'>>;
  let usersUpdateService: jest.Mocked<Pick<UsersUpdateService, 'updateUser'>>;
  let usersGetByEmailService: jest.Mocked<Pick<UsersGetByEmailService, 'getUserByEmail'>>;
  let usersGetByIdService: jest.Mocked<Pick<UsersGetByIdService, 'getUserById'>>;
  let usersListService: jest.Mocked<Pick<UsersListService, 'getUsers'>>;

  beforeEach(async () => {
    usersCreateService = {
      createUser: jest.fn(),
    };

    usersGetByEmailService = {
      getUserByEmail: jest.fn(),
    };

    usersGetByIdService = {
      getUserById: jest.fn(),
    };

    usersUpdateService = {
      updateUser: jest.fn(),
    };

    usersListService = {
      getUsers: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersAdminController],
      providers: [
        { provide: UsersCreateService, useValue: usersCreateService },
        { provide: UsersUpdateService, useValue: usersUpdateService },
        { provide: UsersGetByEmailService, useValue: usersGetByEmailService },
        { provide: UsersGetByIdService, useValue: usersGetByIdService },
        { provide: UsersListService, useValue: usersListService },
      ],
    }).compile();

    controller = module.get<UsersAdminController>(UsersAdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create user', async () => {
    const payload = {
      email: 'test@example.com',
      password: 'Password123!',
      userName: 'test-user',
    };

    const createdUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com',
      userName: 'test-user',
    };

    usersCreateService.createUser.mockResolvedValue(createdUser as never);

    await expect(controller.createUser(payload as never)).resolves.toEqual(createdUser);
    expect(usersCreateService.createUser).toHaveBeenCalledWith(payload);
  });

  it('should get user by email', async () => {
    const params = { email: 'test@example.com' };
    const user = { id: '1', email: params.email };

    usersGetByEmailService.getUserByEmail.mockResolvedValue(user as never);

    await expect(controller.getUserByEmail(params as never)).resolves.toEqual(user);
    expect(usersGetByEmailService.getUserByEmail).toHaveBeenCalledWith(params.email);
  });

  it('should get user by id', async () => {
    const params = { id: '550e8400-e29b-41d4-a716-446655440000' };
    const user = { id: params.id, email: 'test@example.com' };

    usersGetByIdService.getUserById.mockResolvedValue(user as never);

    await expect(controller.getUserById(params as never)).resolves.toEqual(user);
    expect(usersGetByIdService.getUserById).toHaveBeenCalledWith(params.id);
  });

  it('should update user', async () => {
    const params = { id: '550e8400-e29b-41d4-a716-446655440000' };
    const payload = { userName: 'new-name' };
    const updatedUser = { ...params, email: 'test@example.com', userName: 'new-name' };

    usersUpdateService.updateUser.mockResolvedValue(updatedUser as never);

    await expect(controller.updateUser(params as never, payload as never)).resolves.toEqual(
      updatedUser,
    );
    expect(usersUpdateService.updateUser).toHaveBeenCalledWith(params.id, payload);
  });

  it('should get users list', async () => {
    const query = { skip: 0, take: 10 };
    const response = {
      data: [],
      meta: { total: 0, count: 0, page: 1, totalPages: 0, start: 0, end: 0 },
    };

    usersListService.getUsers.mockResolvedValue(response as never);

    await expect(controller.getUsers(query as never)).resolves.toEqual(response);
    expect(usersListService.getUsers).toHaveBeenCalledWith(query);
  });
});
