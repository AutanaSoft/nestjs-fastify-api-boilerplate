import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Passport guard for JWT access tokens.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
