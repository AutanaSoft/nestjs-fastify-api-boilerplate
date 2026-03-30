import { Test, type TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersReadService, UsersSecurityService, UsersWriteService } from '../services';

describe('UsersController', () => {
  let controller: UsersController;
  let usersWriteService: jest.Mocked<Pick<UsersWriteService, 'createUser' | 'updateUser'>>;
  let usersReadService: jest.Mocked<
    Pick<UsersReadService, 'getUserByEmail' | 'getUserById' | 'getUsers'>
  >;
  let usersSecurityService: jest.Mocked<
    Pick<UsersSecurityService, 'updatePassword' | 'verifyEmail'>
  >;

  beforeEach(async () => {
    usersWriteService = {
      createUser: jest.fn(),
      updateUser: jest.fn(),
    };

    usersReadService = {
      getUserByEmail: jest.fn(),
      getUserById: jest.fn(),
      getUsers: jest.fn(),
    };

    usersSecurityService = {
      updatePassword: jest.fn(),
      verifyEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersWriteService, useValue: usersWriteService },
        { provide: UsersReadService, useValue: usersReadService },
        { provide: UsersSecurityService, useValue: usersSecurityService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
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

    usersWriteService.createUser.mockResolvedValue(createdUser as never);

    await expect(controller.createUser(payload as never)).resolves.toEqual(createdUser);
    expect(usersWriteService.createUser).toHaveBeenCalledWith(payload);
  });

  it('should update user', async () => {
    const params = { id: '550e8400-e29b-41d4-a716-446655440000' };
    const payload = { userName: 'new-name' };
    const updatedUser = { ...params, email: 'test@example.com', userName: 'new-name' };

    usersWriteService.updateUser.mockResolvedValue(updatedUser as never);

    await expect(controller.updateUser(params as never, payload as never)).resolves.toEqual(
      updatedUser,
    );
    expect(usersWriteService.updateUser).toHaveBeenCalledWith(params.id, payload);
  });

  it('should update password', async () => {
    const params = { id: '550e8400-e29b-41d4-a716-446655440000' };
    const payload = { current: 'old', new: 'new', confirm: 'new' };

    usersSecurityService.updatePassword.mockResolvedValue(undefined);

    await expect(
      controller.updatePassword(params as never, payload as never),
    ).resolves.toBeUndefined();
    expect(usersSecurityService.updatePassword).toHaveBeenCalledWith(params.id, payload);
  });

  it('should verify email', async () => {
    const params = { email: 'test@example.com' };
    usersSecurityService.verifyEmail.mockResolvedValue(undefined);

    await expect(controller.verifyEmail(params as never)).resolves.toBeUndefined();
    expect(usersSecurityService.verifyEmail).toHaveBeenCalledWith(params.email);
  });

  it('should get user by email', async () => {
    const params = { email: 'test@example.com' };
    const user = { id: '1', email: params.email };
    usersReadService.getUserByEmail.mockResolvedValue(user as never);

    await expect(controller.getUserByEmail(params as never)).resolves.toEqual(user);
    expect(usersReadService.getUserByEmail).toHaveBeenCalledWith(params.email);
  });

  it('should get user by id', async () => {
    const params = { id: '550e8400-e29b-41d4-a716-446655440000' };
    const user = { id: params.id, email: 'test@example.com' };
    usersReadService.getUserById.mockResolvedValue(user as never);

    await expect(controller.getUserById(params as never)).resolves.toEqual(user);
    expect(usersReadService.getUserById).toHaveBeenCalledWith(params.id);
  });

  it('should get users list', async () => {
    const query = { skip: 0, take: 10 };
    const response = {
      data: [],
      meta: { total: 0, count: 0, page: 1, totalPages: 0, start: 0, end: 0 },
    };

    usersReadService.getUsers.mockResolvedValue(response as never);

    await expect(controller.getUsers(query as never)).resolves.toEqual(response);
    expect(usersReadService.getUsers).toHaveBeenCalledWith(query);
  });
});
