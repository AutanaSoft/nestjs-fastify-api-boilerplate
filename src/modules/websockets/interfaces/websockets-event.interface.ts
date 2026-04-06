import type { z } from 'zod';
import type {
  WebSocketAuthErrorEventSchema,
  WebSocketMeSubscriptionSchema,
  WebSocketPingEventSchema,
  WebSocketPongEventSchema,
  WebSocketUserRegisteredSubscriptionSchema,
  WebSocketUserEventSchema,
} from '../schemas';

export type WebSocketPingEvent = z.infer<typeof WebSocketPingEventSchema>;
export type WebSocketPongEvent = z.infer<typeof WebSocketPongEventSchema>;
export type WebSocketAuthErrorEvent = z.infer<typeof WebSocketAuthErrorEventSchema>;
export type WebSocketMeSubscription = z.infer<typeof WebSocketMeSubscriptionSchema>;
export type WebSocketUserRegisteredSubscription = z.infer<
  typeof WebSocketUserRegisteredSubscriptionSchema
>;
export type WebSocketUserEvent = z.infer<typeof WebSocketUserEventSchema>;
