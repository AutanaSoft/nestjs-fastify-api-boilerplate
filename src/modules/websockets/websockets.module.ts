import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/users/users.module';
import { Module } from '@nestjs/common';
import { WebsocketsGateway } from './gateways';
import { WebsocketsUsersListener } from './listeners';
import {
  WebsocketsAuthService,
  WebsocketsEmitterService,
  WebsocketsEventsService,
  WebsocketsMeService,
  WebsocketsUserRegisteredService,
} from './services';

/**
 * WebSockets module wiring.
 */
@Module({
  imports: [AuthModule, UsersModule],
  providers: [
    WebsocketsGateway,
    WebsocketsAuthService,
    WebsocketsEventsService,
    WebsocketsEmitterService,
    WebsocketsMeService,
    WebsocketsUserRegisteredService,
    WebsocketsUsersListener,
  ],
  exports: [
    WebsocketsAuthService,
    WebsocketsEventsService,
    WebsocketsEmitterService,
    WebsocketsMeService,
    WebsocketsUserRegisteredService,
  ],
})
export class WebsocketsModule {}
