import { z } from 'zod';
import { TokenType } from '../enum';

/** Supported custom JWT token purposes. */
export const AuthTokenPurposeSchema = z.enum([TokenType.VERIFY_EMAIL, TokenType.RESET_PASSWORD]);
