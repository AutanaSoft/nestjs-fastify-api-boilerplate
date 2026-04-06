import type { CurrentUser } from '@/modules/auth/interfaces';
import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import type { WebSocketPingEvent, WebSocketPongEvent } from '../interfaces';
import { WebSocketPingEventSchema, WebSocketPongEventSchema } from '../schemas';

/**
 * Encapsulates socket event validation and response building.
 */
@Injectable()
export class WebsocketsEventsService {
  /**
   * Validates an inbound ping payload from an untrusted socket client.
   *
   * @param payload Raw inbound payload.
   * @returns Parsed ping event payload.
   * @throws {WsException} When the payload is invalid.
   */
  parsePingPayload(payload: unknown): WebSocketPingEvent {
    const parsedPayload = WebSocketPingEventSchema.safeParse(payload);

    if (!parsedPayload.success) {
      throw new WsException('Invalid ws.ping payload');
    }

    return parsedPayload.data;
  }

  /**
   * Builds a typed pong response payload from an authenticated user context.
   *
   * @param payload Parsed ping payload.
   * @param currentUser Authenticated socket user context.
   * @returns Typed pong event payload.
   */
  buildPongPayload(payload: WebSocketPingEvent, currentUser: CurrentUser): WebSocketPongEvent {
    return WebSocketPongEventSchema.parse({
      message: 'pong',
      echoedMessage: payload.message,
      userId: currentUser.id,
      sentAt: new Date().toISOString(),
    });
  }
}
