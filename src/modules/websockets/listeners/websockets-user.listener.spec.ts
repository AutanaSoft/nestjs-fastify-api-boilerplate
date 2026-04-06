import { AuthUserRegisteredEvent } from '@/modules/auth/events';
import { UserPasswordUpdatedEvent, UserUpdatedEvent } from '@/modules/users/events';
import { Test, type TestingModule } from '@nestjs/testing';
import { WebsocketsMeService } from '../services/websockets-me.service';
import { WebsocketsUserRegisteredService } from '../services/websockets-user-registered.service';
import { WebsocketsUsersListener } from './websockets-users.listener';

describe('WebsocketsUsersListener', () => {
  let listener: WebsocketsUsersListener;
  let websocketsMeService: jest.Mocked<Pick<WebsocketsMeService, 'processUserUpdatedEvent'>>;
  let websocketsUserRegisteredService: jest.Mocked<
    Pick<WebsocketsUserRegisteredService, 'processUserRegisteredEvent'>
  >;

  beforeEach(async () => {
    websocketsMeService = {
      processUserUpdatedEvent: jest.fn(),
    };
    websocketsUserRegisteredService = {
      processUserRegisteredEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebsocketsUsersListener,
        { provide: WebsocketsMeService, useValue: websocketsMeService },
        { provide: WebsocketsUserRegisteredService, useValue: websocketsUserRegisteredService },
      ],
    }).compile();

    listener = module.get<WebsocketsUsersListener>(WebsocketsUsersListener);
  });

  it('should delegate USER.UPDATED processing to WebsocketsMeService', async () => {
    const event = new UserUpdatedEvent({
      id: '550e8400-e29b-41d4-a716-446655440901',
      email: 'updated-user@example.com',
      userName: 'updated-user',
    });

    await listener.handleUserUpdated(event);

    expect(websocketsMeService.processUserUpdatedEvent).toHaveBeenCalledWith(event);
  });

  it('should delegate USER.UPDATED_PASSWORD processing to WebsocketsMeService', async () => {
    const event = new UserPasswordUpdatedEvent({
      id: '550e8400-e29b-41d4-a716-446655440902',
      email: 'updated-user@example.com',
      userName: 'updated-user',
    });

    await listener.handleUserUpdated(event);

    expect(websocketsMeService.processUserUpdatedEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          id: '550e8400-e29b-41d4-a716-446655440902',
          email: 'updated-user@example.com',
          userName: 'updated-user',
        },
      }),
    );
  });

  it('should delegate AUTH.USER_REGISTERED processing to WebsocketsUserRegisteredService', async () => {
    const event = new AuthUserRegisteredEvent({
      email: 'registered-user@example.com',
      userName: 'registered-user',
      token: 'verification-token',
    });

    await listener.handleUserRegistered(event);

    expect(websocketsUserRegisteredService.processUserRegisteredEvent).toHaveBeenCalledWith(event);
  });
});
