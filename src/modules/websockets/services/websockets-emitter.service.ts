import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { Server } from 'socket.io';
import type { WebSocketUserEvent } from '../interfaces';

/**
 * Centralizes socket event emissions and room naming.
 */
@Injectable()
export class WebsocketsEmitterService {
  private _server: Server | null = null;

  constructor(private readonly _logger: PinoLogger) {
    this._logger.setContext(WebsocketsEmitterService.name);
  }

  /**
   * Registers the socket server instance for future emissions.
   *
   * @param server Active Socket.IO server instance.
   */
  registerServer(server: Server): void {
    this._server = server;
  }

  /**
   * Emits the current-user update event to the user's dedicated room.
   *
   * @param userId Target user identifier.
   * @param payload Serialized user payload.
   */
  emitMeUpdated(userId: string, payload: WebSocketUserEvent): void {
    this.emitToRoom(this.buildUserRoomName(userId), 'me', payload);
  }

  /**
   * Emits user-registered notifications to the shared room.
   *
   * @param payload Serialized user payload.
   */
  emitUserRegistered(payload: WebSocketUserEvent): void {
    this.emitToRoom(this.buildUserRegisteredRoomName(), 'userRegistered', payload);
  }

  /**
   * Builds room name for per-user notifications.
   *
   * @param userId User identifier.
   * @returns Room name.
   */
  buildUserRoomName(userId: string): string {
    return `user:${userId}`;
  }

  /**
   * Builds room name for user-registered notifications.
   *
   * @returns Room name.
   */
  buildUserRegisteredRoomName(): string {
    return 'users:registered';
  }

  private emitToRoom(
    room: string,
    event: 'me' | 'userRegistered',
    payload: WebSocketUserEvent,
  ): void {
    if (!this._server) {
      this._logger.warn({ room, event }, 'WebSocket server not registered; skipping emit');
      return;
    }

    this._server.to(room).emit(event, payload);
  }
}
