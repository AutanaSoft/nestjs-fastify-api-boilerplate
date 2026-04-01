import { UnauthorizedException } from '@nestjs/common';

/**
 * Throws a standardized unauthorized error for invalid auth credentials.
 */
export const throwInvalidCredentials = (): never => {
  throw new UnauthorizedException('Invalid credentials');
};
