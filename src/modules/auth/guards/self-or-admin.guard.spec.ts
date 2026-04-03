import type { ExecutionContext } from '@nestjs/common';
import { SelfOrAdminGuard } from './self-or-admin.guard';

describe('SelfOrAdminGuard', () => {
  let guard: SelfOrAdminGuard;

  beforeEach(() => {
    guard = new SelfOrAdminGuard();
  });

  const buildExecutionContext = (request: {
    user?: { id: string; role: 'ADMIN' | 'USER' | 'GUEST' };
    params?: { id?: string };
  }): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as ExecutionContext;

  it('allows access when requester is admin', () => {
    const context = buildExecutionContext({
      user: { id: 'u-1', role: 'ADMIN' },
      params: { id: 'other-id' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access when requester owns target resource', () => {
    const context = buildExecutionContext({
      user: { id: 'u-1', role: 'USER' },
      params: { id: 'u-1' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies access when requester is neither owner nor admin', () => {
    const context = buildExecutionContext({
      user: { id: 'u-1', role: 'USER' },
      params: { id: 'u-2' },
    });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('denies access when request has no user', () => {
    const context = buildExecutionContext({
      params: { id: 'u-1' },
    });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('denies access when request has no target id param', () => {
    const context = buildExecutionContext({
      user: { id: 'u-1', role: 'USER' },
      params: {},
    });

    expect(guard.canActivate(context)).toBe(false);
  });
});
