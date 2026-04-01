import type { UserRole, UserStatus } from '@/modules/database/prisma/generated/enums';
import type { AUTH_TOKEN_PURPOSES } from '../constants';

export interface JwtAccessPayload {
  sub: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  userName: string;
  sessionId: string;
  type: 'access';
}

export interface JwtCustomPayload {
  sub: string;
  email: string;
  userName: string;
  purpose: (typeof AUTH_TOKEN_PURPOSES)[keyof typeof AUTH_TOKEN_PURPOSES];
  type: 'custom';
}
