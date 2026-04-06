import type { z } from 'zod';
import type { WebSocketHandshakeAuthSchema, WebSocketHandshakeHeadersSchema } from '../schemas';

export type WebSocketHandshakeAuth = z.infer<typeof WebSocketHandshakeAuthSchema>;
export type WebSocketHandshakeHeaders = z.infer<typeof WebSocketHandshakeHeadersSchema>;
