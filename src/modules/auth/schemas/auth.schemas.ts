import { UserRole, UserStatus } from '@/modules/database/prisma/generated/enums';
import {
  EmailSchema,
  IsoDateTimeFromDateSchema,
  NullableIsoDateTimeFromDateSchema,
  PasswordSchema,
  UserNameSchema,
  UserRolesEnumSchema,
  UserStatusEnumSchema,
  UuidSchema,
} from '@/shared/schemas';
import { z } from 'zod';
import { AUTH_TOKEN_PURPOSES } from '../constants';

export const AuthTokenPurposeSchema = z.enum([
  AUTH_TOKEN_PURPOSES.VERIFY_EMAIL,
  AUTH_TOKEN_PURPOSES.RESET_PASSWORD,
]);

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

export const MeResponseSchema = UserAuthEntitySchema.omit({ password: true }).extend({
  emailVerifiedAt: NullableIsoDateTimeFromDateSchema,
  createdAt: IsoDateTimeFromDateSchema,
  updatedAt: IsoDateTimeFromDateSchema,
});

export const AuthSessionSchema = z.object({
  createdAt: IsoDateTimeFromDateSchema,
  expiredAt: IsoDateTimeFromDateSchema,
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

export const SignUpInputSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  userName: UserNameSchema,
});

export const SignInInputSchema = z.object({
  identifier: z
    .string()
    .min(1)
    .transform((value) => value.trim()),
  password: PasswordSchema,
});

export const RefreshInputSchema = z.object({
  refreshToken: z.string().min(1),
});

export const RequestEmailVerificationInputSchema = z.object({
  email: EmailSchema,
});

export const VerifyEmailInputSchema = z.object({
  token: z.string().min(1),
});

export const ForgotPasswordInputSchema = z.object({
  email: EmailSchema,
});

export const ResetPasswordInputSchema = z
  .object({
    token: z.string().min(1),
    newPassword: PasswordSchema,
    confirmPassword: PasswordSchema,
  })
  .refine((payload) => payload.newPassword === payload.confirmPassword, {
    message: 'newPassword and confirmPassword must match',
    path: ['confirmPassword'],
  });

export const AuthSessionEntitySchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  revokedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const AuthRefreshTokenEntitySchema = z.object({
  id: UuidSchema,
  sessionId: UuidSchema,
  tokenHash: z.string().min(1),
  expiresAt: z.date(),
  revokedAt: z.date().nullable(),
  usedAt: z.date().nullable(),
  rotatedFromId: UuidSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateAuthUserInputSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1),
  userName: UserNameSchema,
  role: UserRolesEnumSchema.default(UserRole.USER),
  status: UserStatusEnumSchema.default(UserStatus.REGISTERED),
});

export type AuthTokenPurpose = z.infer<typeof AuthTokenPurposeSchema>;
export type UserAuthEntity = z.infer<typeof UserAuthEntitySchema>;
export type MeResponse = Omit<UserAuthEntity, 'password'>;
export interface AuthSession {
  createdAt: Date;
  expiredAt: Date;
  accessToken: string;
  refreshToken: string;
}
export type SignUpInput = z.infer<typeof SignUpInputSchema>;
export type SignInInput = z.infer<typeof SignInInputSchema>;
export type RefreshInput = z.infer<typeof RefreshInputSchema>;
export type RequestEmailVerificationInput = z.infer<typeof RequestEmailVerificationInputSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailInputSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;
export type AuthSessionEntity = z.infer<typeof AuthSessionEntitySchema>;
export type AuthRefreshTokenEntity = z.infer<typeof AuthRefreshTokenEntitySchema>;
export type CreateAuthUserInput = z.infer<typeof CreateAuthUserInputSchema>;
