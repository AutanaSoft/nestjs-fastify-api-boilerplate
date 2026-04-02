import { EmailSchema, PasswordSchema, UserNameSchema } from '@/shared/schemas';
import { z } from 'zod';

/** Input schema for sign-up. */
export const SignUpInputSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  userName: UserNameSchema,
});

/** Input schema for sign-in. */
export const SignInInputSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

/** Input schema for refresh. */
export const RefreshInputSchema = z.object({
  refreshToken: z.string().min(1),
});

/** Input schema to request email verification. */
export const RequestEmailVerificationInputSchema = z.object({
  email: EmailSchema,
});

/** Input schema to verify user email. */
export const VerifyEmailInputSchema = z.object({
  token: z.string().min(1),
});

/** Input schema to request password recovery. */
export const ForgotPasswordInputSchema = z.object({
  email: EmailSchema,
});

/** Input schema to reset password. */
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

/** Input schema for auth repository create user operation. */
export const CreateAuthUserDataSchema = SignUpInputSchema.extend({
  password: z.string().min(1),
});
