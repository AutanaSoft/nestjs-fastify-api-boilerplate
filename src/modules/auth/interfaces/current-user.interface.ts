import type { UserRole, UserStatus } from '@/modules/database/prisma/generated/enums';

export interface CurrentUser {
  id: string;
  email: string;
  userName: string;
  role: UserRole;
  status: UserStatus;
  sessionId: string;
}
