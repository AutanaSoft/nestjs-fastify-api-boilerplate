import { Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { PinoLogger } from 'nestjs-pino';
import type { Server, Socket } from 'socket.io';
import {
  WebsocketsAuthService,
  WebsocketsEmitterService,
  WebsocketsEventsService,
} from '../services';
import { WebsocketsMeService } from '../services/websockets-me.service';
import { WebsocketsUserRegisteredService } from '../services/websockets-user-registered.service';

/**
 * WebSocket transport gateway for authenticated realtime communication.
 */
@Injectable()
@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class WebsocketsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly _websocketsAuthService: WebsocketsAuthService,
    private readonly _websocketsEventsService: WebsocketsEventsService,
    private readonly _websocketsMeService: WebsocketsMeService,
    private readonly _websocketsUserRegisteredService: WebsocketsUserRegisteredService,
    private readonly _websocketsEmitterService: WebsocketsEmitterService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(WebsocketsGateway.name);
  }

  /**
   * Registers the runtime socket server instance for downstream emitters.
   */
  afterInit(): void {
    this._websocketsEmitterService.registerServer(this.server);
  }

  /**
   * Handles a new socket connection and enforces JWT authentication.
   *
   * @param client Connected socket client.
   */
  async handleConnection(client: Socket): Promise<void> {
    try {
      const currentUser = await this._websocketsAuthService.authenticateClient(client);
      const socketData = client.data as Record<string, unknown>;
      socketData.currentUser = currentUser;

      this._logger.info(
        {
          socketId: client.id,
          userId: currentUser.id,
        },
        'WebSocket client connected',
      );
    } catch (error: unknown) {
      this._logger.warn(
        {
          error,
          socketId: client.id,
        },
        'WebSocket authentication failed; disconnecting client',
      );

      client.emit('ws.error', this._websocketsAuthService.buildUnauthorizedErrorPayload());
      client.disconnect(true);
    }
  }

  /**
   * Handles socket disconnection and emits audit logs.
   *
   * @param client Disconnected socket client.
   */
  handleDisconnect(client: Socket): void {
    this._logger.info(
      {
        socketId: client.id,
      },
      'WebSocket client disconnected',
    );
  }

  /**
   * Handles the `ws.ping` event and emits a typed `ws.pong` response.
   *
   * @param client Authenticated socket client.
   * @param payload Inbound event payload.
   */
  @SubscribeMessage('ws.ping')
  handlePing(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown): void {
    const currentUser = this._websocketsAuthService.getSocketCurrentUser(client);
    const pingPayload = this._websocketsEventsService.parsePingPayload(payload);
    const pongPayload = this._websocketsEventsService.buildPongPayload(pingPayload, currentUser);

    client.emit('ws.pong', pongPayload);
  }

  /**
   * Subscribes the authenticated client to its own user-update notifications.
   *
   * @param client Authenticated socket client.
   */
  @SubscribeMessage('me')
  async handleMeSubscription(@ConnectedSocket() client: Socket): Promise<void> {
    await this._websocketsMeService.subscribeMe(client);
  }

  /**
   * Subscribes the authenticated client to user registered notifications.
   *
   * @param client Authenticated socket client.
   */
  @SubscribeMessage('userRegistered')
  async handleUserRegisteredSubscription(@ConnectedSocket() client: Socket): Promise<void> {
    await this._websocketsUserRegisteredService.subscribeUserRegistered(client);
  }
}
