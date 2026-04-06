import { AuthPasswordResetEvent } from '@/modules/auth/events/auth.events';
import { UserUpdatedEvent } from '@/modules/users/events/users.events';
import { UserEventPayloadSchema } from '@/modules/users/schemas/user-event.schema';
import { UserModelSchema } from '@/modules/users/schemas/user-output.schema';
import { UsersGetByIdService } from '@/modules/users/services/users-get-by-id.service';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { Socket } from 'socket.io';
import { WebsocketsAuthService } from './websockets-auth.service';
import { WebsocketsEmitterService } from './websockets-emitter.service';

/**
 * Handles websocket "me" subscription and update notifications.
 */
@Injectable()
export class WebsocketsMeService {
  constructor(
    private readonly _usersGetByIdService: UsersGetByIdService,
    private readonly _websocketsAuthService: WebsocketsAuthService,
    private readonly _websocketsEmitterService: WebsocketsEmitterService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(WebsocketsMeService.name);
  }

  /**
   * Processes users updated domain events and emits typed websocket payloads.
   *
   * @param event Users updated event.
   */
  async processUserUpdatedEvent(event: UserUpdatedEvent | AuthPasswordResetEvent): Promise<void> {
    const parsedPayload = UserEventPayloadSchema.safeParse(event.payload);

    if (!parsedPayload.success) {
      this._logger.error(
        {
          eventName: event instanceof UserUpdatedEvent ? 'user.updated' : 'user.updated_password',
          payload: event.payload,
          error: parsedPayload.error,
        },
        'Received invalid users updated event payload',
      );
      return;
    }

    try {
      const updatedUser = await this._usersGetByIdService.getUserById(parsedPayload.data.id);
      const serializedUser = UserModelSchema.parse(updatedUser);
      this._websocketsEmitterService.emitMeUpdated(updatedUser.id, serializedUser);
    } catch (error: unknown) {
      this._logger.warn(
        {
          error,
          eventName: event instanceof UserUpdatedEvent ? 'user.updated' : 'user.updated_password',
          userId: parsedPayload.data.id,
        },
        'Could not emit user updated websocket notification',
      );
    }
  }

  /**
   * Subscribes an authenticated client to personal update notifications.
   *
   * @param client Authenticated socket client.
   */
  async subscribeMe(client: Socket): Promise<void> {
    const currentUser = this._websocketsAuthService.getSocketCurrentUser(client);
    await client.join(this._websocketsEmitterService.buildUserRoomName(currentUser.id));
  }
}
