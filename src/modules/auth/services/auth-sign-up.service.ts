import { PasswordHashService } from '@modules/security/services';
import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { TokenType } from '../enum';
import type { AuthSession, SignUpInput, UserAuthEntity } from '../interfaces';
import { AuthRepository } from '../repositories';
import {
  AuthContractValidationError,
  AuthPersistenceNotFoundError,
  AuthPersistenceUnexpectedError,
  AuthPersistenceUniqueConstraintError,
} from '../errors';
import {
  CreateAuthUserDataSchema,
  EmailTokenPayloadSchema,
  SignCustomTokenInputSchema,
} from '../schemas';
import { AuthEventsService } from './auth-events.service';
import { JwtTokenService } from './jwt-token.service';
import { RefreshTokenService } from './refresh-token.service';

/**
 * Handles user registration by creating the account, issuing session tokens,
 * and dispatching the verification-email event.
 */
@Injectable()
export class AuthSignUpService {
  constructor(
    private readonly _authRepository: AuthRepository,
    private readonly _passwordHashService: PasswordHashService,
    private readonly _refreshTokenService: RefreshTokenService,
    private readonly _jwtTokenService: JwtTokenService,
    private readonly _authEventsService: AuthEventsService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(AuthSignUpService.name);
  }

  /**
   * Registers a new user and returns the initial auth session.
   *
   * Flow:
   * 1. Hash the submitted password.
   * 2. Persist the user through the repository contract.
   * 3. Issue access/refresh tokens.
   * 4. Generate and emit the email-verification token event.
   *
   * @param payload External sign-up contract already validated by DTO/Zod.
   * @returns Auth session payload with access and refresh tokens.
   * @throws {ConflictException} When email or userName already exists.
   * @throws {InternalServerErrorException} For unexpected persistence or contract failures.
   */
  async signUp(payload: SignUpInput): Promise<AuthSession> {
    // Password never reaches persistence in plain text.
    const passwordHash = await this._passwordHashService.hashPassword(payload.password);

    const createData = CreateAuthUserDataSchema.parse({
      ...payload,
      password: passwordHash,
    });

    let createdUser: UserAuthEntity;
    try {
      createdUser = await this._authRepository.createUser(createData);
    } catch (error: unknown) {
      // Repository errors are translated into HTTP exceptions at service layer.
      if (error instanceof AuthPersistenceUniqueConstraintError) {
        throw new ConflictException(error.message);
      }

      if (
        error instanceof AuthContractValidationError ||
        error instanceof AuthPersistenceUnexpectedError ||
        error instanceof AuthPersistenceNotFoundError
      ) {
        this._logger.error(
          { error, email: payload.email, userName: payload.userName },
          'Sign-up persistence stage failed',
        );
        throw new InternalServerErrorException('Internal server error');
      }

      throw error;
    }

    const session = await this._refreshTokenService.issueTokens(createdUser);

    // Build a purpose-scoped custom token for email verification.
    const customPayload = SignCustomTokenInputSchema.parse({
      ...createdUser,
      userId: createdUser.id,
      purpose: TokenType.VERIFY_EMAIL,
    });

    const verifyToken = await this._jwtTokenService.signCustomToken(customPayload);

    const emailPayload = EmailTokenPayloadSchema.parse({
      ...createdUser,
      token: verifyToken,
    });

    // Decoupled side effect: notification is emitted through domain events.
    this._authEventsService.emitUserRegistered(emailPayload);

    return session;
  }
}
