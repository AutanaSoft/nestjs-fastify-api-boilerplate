import { AuthPasswordResetEvent, AuthUserRegisteredEvent } from '@/modules/auth/events';
import { UserUpdatedEvent } from '@/modules/users/events';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENT_NAMES } from '@shared/constants/event-names.constants';
import { WebsocketsUserRegisteredService } from '../services';
import { WebsocketsMeService } from '../services/websockets-me.service';

/**
 * Routes users/auth domain events into websocket services.
 */
@Injectable()
export class WebsocketsUsersListener {
  constructor(
    private readonly _websocketsMeService: WebsocketsMeService,
    private readonly _websocketsUserRegisteredService: WebsocketsUserRegisteredService,
  ) {}

  /**
   * Handles users updated domain events and emits typed websocket payloads.
   *
   * @param event Users updated event.
   */
  @OnEvent(EVENT_NAMES.USER.UPDATED, { async: true })
  @OnEvent(EVENT_NAMES.AUTH.PASSWORD_RESET, { async: true })
  @OnEvent(EVENT_NAMES.USER.UPDATED_PASSWORD, { async: true })
  async handleUserUpdated(event: UserUpdatedEvent | AuthPasswordResetEvent): Promise<void> {
    await this._websocketsMeService.processUserUpdatedEvent(event);
  }

  /**
   * Handles auth user-registered events and emits typed websocket payloads.
   *
   * @param event Auth user registered event.
   */
  @OnEvent(EVENT_NAMES.AUTH.USER_REGISTERED, { async: true })
  async handleUserRegistered(event: AuthUserRegisteredEvent): Promise<void> {
    await this._websocketsUserRegisteredService.processUserRegisteredEvent(event);
  }
}
