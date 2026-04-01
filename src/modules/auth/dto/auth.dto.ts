import { createZodDto } from 'nestjs-zod';
import {
  AuthSessionSchema,
  ForgotPasswordInputSchema,
  MeResponseSchema,
  RefreshInputSchema,
  RequestEmailVerificationInputSchema,
  ResetPasswordInputSchema,
  SignInInputSchema,
  SignUpInputSchema,
  VerifyEmailInputSchema,
} from '../schemas';

/**
 * Input DTO for auth sign-up.
 */
export class SignUpDto extends createZodDto(SignUpInputSchema) {}

/**
 * Input DTO for auth sign-in.
 */
export class SignInDto extends createZodDto(SignInInputSchema) {}

/**
 * Input DTO for auth refresh.
 */
export class RefreshDto extends createZodDto(RefreshInputSchema) {}

/**
 * Input DTO for requesting email verification.
 */
export class RequestEmailVerificationDto extends createZodDto(
  RequestEmailVerificationInputSchema,
) {}

/**
 * Input DTO for verifying email.
 */
export class VerifyEmailDto extends createZodDto(VerifyEmailInputSchema) {}

/**
 * Input DTO for requesting password reset.
 */
export class ForgotPasswordDto extends createZodDto(ForgotPasswordInputSchema) {}

/**
 * Input DTO for resetting password.
 */
export class ResetPasswordDto extends createZodDto(ResetPasswordInputSchema) {}

/**
 * Output DTO for auth sessions.
 */
export class AuthSessionDto extends createZodDto(AuthSessionSchema) {}

/**
 * Output DTO for authenticated user profile.
 */
export class MeResponseDto extends createZodDto(MeResponseSchema) {}
