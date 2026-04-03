import { CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { CurrentUser } from '../interfaces';

/**
 * Allows access when requester owns the target resource or has ADMIN role.
 */
@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  /**
   * Authorizes access when requester is ADMIN or owner of the target `:id` resource.
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

    if (user.role === 'ADMIN') {
      return true;
    }

    return user.id === targetId;
  }
}
