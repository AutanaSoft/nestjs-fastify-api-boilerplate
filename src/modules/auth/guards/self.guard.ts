import { CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { CurrentUser } from '../interfaces';

/**
 * Allows access only when requester owns the target `:id` resource.
 */
@Injectable()
export class SelfGuard implements CanActivate {
  /**
   * Authorizes access when current user id matches route param id.
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: CurrentUser;
      params?: { id?: string };
    }>();

    const user = request.user;
    const targetId = request.params?.id;

    if (!user || !targetId) {
      return false;
    }

    return user.id === targetId;
  }
}
