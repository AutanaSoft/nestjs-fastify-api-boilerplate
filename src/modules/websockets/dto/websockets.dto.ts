import { createZodDto } from 'nestjs-zod';
import {
  WebSocketAuthErrorEventSchema,
  WebSocketMeSubscriptionSchema,
  WebSocketPingEventSchema,
  WebSocketPongEventSchema,
  WebSocketUserRegisteredSubscriptionSchema,
  WebSocketUserEventSchema,
} from '../schemas';

export class WebSocketPingEventDto extends createZodDto(WebSocketPingEventSchema) {}
export class WebSocketPongEventDto extends createZodDto(WebSocketPongEventSchema) {}
export class WebSocketAuthErrorEventDto extends createZodDto(WebSocketAuthErrorEventSchema) {}
export class WebSocketMeSubscriptionDto extends createZodDto(WebSocketMeSubscriptionSchema) {}
export class WebSocketUserRegisteredSubscriptionDto extends createZodDto(
  WebSocketUserRegisteredSubscriptionSchema,
) {}
export class WebSocketUserEventDto extends createZodDto(WebSocketUserEventSchema) {}
