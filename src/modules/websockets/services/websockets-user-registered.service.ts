import { AuthUserRegisteredEvent } from '@/modules/auth/events';
import { AuthWithTokenEventSchema } from '@/modules/auth/schemas';
import { UsersGetByEmailService } from '@/modules/users/services';
import { EVENT_NAMES } from '@/shared/constants/event-names.constants';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { Socket } from 'socket.io';
import { UserModelSchema } from '../../users/schemas';
import { WebsocketsAuthService } from './websockets-auth.service';
import { WebsocketsEmitterService } from './websockets-emitter.service';

/**
 * Handles websocket "userRegistered" subscription and notifications.
 */
@Injectable()
export class WebsocketsUserRegisteredService {
  constructor(
    private readonly _usersGetByEmailService: UsersGetByEmailService,
    private readonly _websocketsAuthService: WebsocketsAuthService,
    private readonly _websocketsEmitterService: WebsocketsEmitterService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(WebsocketsUserRegisteredService.name);
  }

  /**
   * Subscribes an authenticated client to user registered notifications.
   *
   * @param client Authenticated socket client.
   */
  async subscribeUserRegistered(client: Socket): Promise<void> {
    this._websocketsAuthService.getSocketCurrentUser(client);
    await client.join(this._websocketsEmitterService.buildUserRegisteredRoomName());
  }

  /**
   * Processes auth user-registered events and emits typed websocket payloads.
   *
   * @param event Auth user registered event.
   */
  async processUserRegisteredEvent(event: AuthUserRegisteredEvent): Promise<void> {
    const parsedPayload = AuthWithTokenEventSchema.safeParse(event.payload);

    if (!parsedPayload.success) {
      this._logger.error(
        {
          eventName: EVENT_NAMES.AUTH.USER_REGISTERED,
          payload: event.payload,
          error: parsedPayload.error,
        },
        'Received invalid auth user registered event payload',
      );
      return;
    }

    try {
      const registeredUser = await this._usersGetByEmailService.getUserByEmail(
        parsedPayload.data.email,
      );
      const serializedUser = UserModelSchema.parse(registeredUser);
      this._websocketsEmitterService.emitUserRegistered(serializedUser);
    } catch (error: unknown) {
      this._logger.warn(
        {
          error,
          eventName: EVENT_NAMES.AUTH.USER_REGISTERED,
          email: parsedPayload.data.email,
        },
        'Could not emit user registered websocket notification',
      );
    }
  }
}
