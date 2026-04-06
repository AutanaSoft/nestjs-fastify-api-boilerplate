import { z } from 'zod';

/** Socket handshake auth payload shape. */
export const WebSocketHandshakeAuthSchema = z.object({
  token: z.string().trim().min(1),
});

/** Socket handshake headers subset used for bearer auth fallback. */
export const WebSocketHandshakeHeadersSchema = z.object({
  authorization: z.string().trim().min(1).optional(),
});
