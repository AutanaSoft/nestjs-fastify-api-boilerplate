import type { CurrentUser } from '@/modules/auth/interfaces';
import { CurrentUserSchema } from '@/modules/auth/schemas/auth-user.schema';
import { JwtTokenService } from '@/modules/auth/services';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Socket } from 'socket.io';
import { WebSocketAuthErrorEventSchema } from '../schemas';
import { WebSocketHandshakeAuthSchema, WebSocketHandshakeHeadersSchema } from '../schemas';

/**
 * Resolves and validates socket authentication from handshake data.
 */
@Injectable()
export class WebsocketsAuthService {
  constructor(private readonly _jwtTokenService: JwtTokenService) {}

  /**
   * Authenticates an inbound socket client from handshake data.
   *
   * @param client Connected socket client.
   * @returns Authenticated current user context.
   * @throws {UnauthorizedException} When token extraction or verification fails.
   */
  async authenticateClient(client: Socket): Promise<CurrentUser> {
    const token = this.extractTokenFromHandshake(client);
    return this._jwtTokenService.verifyAccessToken(token);
  }

  /**
   * Validates and returns the authenticated user context attached to socket data.
   *
   * @param client Socket with previously attached auth context.
   * @returns Validated authenticated user context.
   * @throws {UnauthorizedException} When socket data is missing or malformed.
   */
  getSocketCurrentUser(client: Socket): CurrentUser {
    const socketData = client.data as Record<string, unknown>;
    const parsedCurrentUser = CurrentUserSchema.safeParse(socketData.currentUser);

    if (!parsedCurrentUser.success) {
      throw new UnauthorizedException('Socket client is not authenticated');
    }

    return parsedCurrentUser.data;
  }

  /**
   * Builds a typed auth error payload used before socket disconnect.
   *
   * @returns Typed socket auth error payload.
   */
  buildUnauthorizedErrorPayload() {
    return WebSocketAuthErrorEventSchema.parse({
      code: 'UNAUTHORIZED',
      message: 'Unauthorized socket connection',
    });
  }

  private extractTokenFromHandshake(client: Socket): string {
    const parsedAuth = WebSocketHandshakeAuthSchema.safeParse(client.handshake.auth);

    if (parsedAuth.success) {
      return parsedAuth.data.token;
    }

    const parsedHeaders = WebSocketHandshakeHeadersSchema.safeParse(client.handshake.headers);

    if (!parsedHeaders.success || !parsedHeaders.data.authorization) {
      throw new UnauthorizedException('Missing access token');
    }

    const [, token] = parsedHeaders.data.authorization.split(' ');

    if (!token || !parsedHeaders.data.authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid bearer authorization header');
    }

    return token.trim();
  }
}
