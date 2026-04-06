import type { CurrentUser } from '@/modules/auth/interfaces';
import { WsException } from '@nestjs/websockets';
import { WebsocketsEventsService } from './websockets-events.service';

describe('WebsocketsEventsService', () => {
  let service: WebsocketsEventsService;

  const currentUser: CurrentUser = {
    id: '550e8400-e29b-41d4-a716-446655440501',
    email: 'events-user@example.com',
    userName: 'events-user',
    role: 'USER',
    status: 'ACTIVE',
    sessionId: '550e8400-e29b-41d4-a716-446655440502',
  };

  beforeEach(() => {
    service = new WebsocketsEventsService();
  });

  it('should parse valid ping payload', () => {
    expect(service.parsePingPayload({ message: 'hello' })).toEqual({ message: 'hello' });
  });

  it('should throw WsException on invalid ping payload', () => {
    expect(() => service.parsePingPayload({ message: '' })).toThrow(WsException);
  });

  it('should build typed pong payload', () => {
    const payload = service.buildPongPayload({ message: 'hello' }, currentUser);

    expect(payload.message).toBe('pong');
    expect(payload.echoedMessage).toBe('hello');
    expect(payload.userId).toBe(currentUser.id);
    expect(typeof payload.sentAt).toBe('string');
  });
});
