import { UserRole, UserStatus } from '@/modules/database/prisma/generated/enums';
import { z } from 'zod';

/** Persisted auth user entity shape. */
export const UserAuthEntitySchema = z.object({
  id: z.uuid(),
  userName: z.string(),
  email: z.email(),
  password: z.string(),
  role: z.enum(UserRole),
  status: z.enum(UserStatus),
  emailVerifiedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/** Authenticated user context shape attached to requests. */
export const CurrentUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  userName: z.string(),
  role: z.enum(UserRole),
  status: z.enum(UserStatus),
  sessionId: z.uuid(),
});
