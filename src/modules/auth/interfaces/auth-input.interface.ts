import type { z } from 'zod';
import type {
  ForgotPasswordInputSchema,
  RefreshInputSchema,
  RequestEmailVerificationInputSchema,
  ResetPasswordInputSchema,
  SignInInputSchema,
  SignUpInputSchema,
  VerifyEmailInputSchema,
} from '../schemas';

export type SignUpInput = z.infer<typeof SignUpInputSchema>;
export type SignInInput = z.infer<typeof SignInInputSchema>;
export type RefreshInput = z.infer<typeof RefreshInputSchema>;
export type RequestEmailVerificationInput = z.infer<typeof RequestEmailVerificationInputSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailInputSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;
