import { UserModelSchema } from '@/modules/users/schemas';
import { z } from 'zod';

/** Inbound ping event payload from client. */
export const WebSocketPingEventSchema = z.object({
  message: z.string().trim().min(1).max(200),
});

/** Outbound pong event payload sent by server. */
export const WebSocketPongEventSchema = z.object({
  message: z.literal('pong'),
  echoedMessage: z.string().min(1),
  userId: z.uuid(),
  sentAt: z.string().min(1),
});

/** Outbound socket auth error payload sent before disconnect. */
export const WebSocketAuthErrorEventSchema = z.object({
  code: z.literal('UNAUTHORIZED'),
  message: z.string().min(1),
});

/** Inbound subscription event payload for current-user updates. */
export const WebSocketMeSubscriptionSchema = z.object({});

/** Inbound subscription event payload for user-registered notifications. */
export const WebSocketUserRegisteredSubscriptionSchema = z.object({});

/** Outbound user payload delivered through socket notifications. */
export const WebSocketUserEventSchema = UserModelSchema;
