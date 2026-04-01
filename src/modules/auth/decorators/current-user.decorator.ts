import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { CurrentUser as CurrentUserPayload } from '../interfaces';

/**
 * Extracts the authenticated user from request context.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: CurrentUserPayload }>();
    return request.user;
  },
);
