import { Test, type TestingModule } from '@nestjs/testing';
import { UsersGetMeService, UsersUpdatePasswordService } from '../services';
import { UsersProfileController } from './users-profile.controller';

describe('UsersProfileController', () => {
  let controller: UsersProfileController;
  let usersGetMeService: jest.Mocked<Pick<UsersGetMeService, 'getMe'>>;
  let usersUpdatePasswordService: jest.Mocked<Pick<UsersUpdatePasswordService, 'updatePassword'>>;

  beforeEach(async () => {
    usersGetMeService = {
      getMe: jest.fn(),
    };

    usersUpdatePasswordService = {
      updatePassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersProfileController],
      providers: [
        { provide: UsersGetMeService, useValue: usersGetMeService },
        { provide: UsersUpdatePasswordService, useValue: usersUpdatePasswordService },
      ],
    }).compile();

    controller = module.get<UsersProfileController>(UsersProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get current user profile', async () => {
    const currentUser = { id: '550e8400-e29b-41d4-a716-446655440000' };
    const user = { id: currentUser.id, email: 'me@example.com', userName: 'me-user' };

    usersGetMeService.getMe.mockResolvedValue(user as never);

    await expect(controller.getMe(currentUser as never)).resolves.toEqual(user);
    expect(usersGetMeService.getMe).toHaveBeenCalledWith(currentUser.id);
  });

  it('should update password', async () => {
    const params = { id: '550e8400-e29b-41d4-a716-446655440000' };
    const payload = { current: 'old', new: 'new', confirm: 'new' };

    usersUpdatePasswordService.updatePassword.mockResolvedValue(undefined);

    await expect(
      controller.updatePassword(params as never, payload as never),
    ).resolves.toBeUndefined();
    expect(usersUpdatePasswordService.updatePassword).toHaveBeenCalledWith(params.id, payload);
  });
});
