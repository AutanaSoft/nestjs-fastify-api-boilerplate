import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import {
  AuthSessionDto,
  ForgotPasswordDto,
  RefreshDto,
  RequestEmailVerificationDto,
  ResetPasswordDto,
  SignInDto,
  SignUpDto,
  VerifyEmailDto,
} from '../dto';
import { CurrentUser } from '../decorators';
import { JwtAuthGuard } from '../guards';
import type { AuthSession, CurrentUser as CurrentUserPayload } from '../interfaces';
import {
  AuthEmailVerificationService,
  AuthPasswordRecoveryService,
  AuthRefreshService,
  AuthSignInService,
  AuthSignOutService,
  AuthSignUpService,
} from '../services';

/**
 * HTTP controller for auth module endpoints.
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly _authSignUpService: AuthSignUpService,
    private readonly _authSignInService: AuthSignInService,
    private readonly _authRefreshService: AuthRefreshService,
    private readonly _authSignOutService: AuthSignOutService,
    private readonly _authEmailVerificationService: AuthEmailVerificationService,
    private readonly _authPasswordRecoveryService: AuthPasswordRecoveryService,
  ) {}

  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(AuthSessionDto)
  @ApiOperation({ summary: 'Sign up a user' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AuthSessionDto })
  async signUp(@Body() payload: SignUpDto): Promise<AuthSession> {
    return this._authSignUpService.signUp(payload);
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(AuthSessionDto)
  @ApiOperation({ summary: 'Sign in a user' })
  @ApiResponse({ status: HttpStatus.OK, type: AuthSessionDto })
  async signIn(@Body() payload: SignInDto): Promise<AuthSession> {
    return this._authSignInService.signIn(payload);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(AuthSessionDto)
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiResponse({ status: HttpStatus.OK, type: AuthSessionDto })
  async refresh(@Body() payload: RefreshDto): Promise<AuthSession> {
    return this._authRefreshService.refresh(payload);
  }

  @Post('sign-out')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sign out current user session' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async signOut(@CurrentUser() currentUser: CurrentUserPayload): Promise<void> {
    await this._authSignOutService.signOut(currentUser);
  }

  @Post('request-email-verification')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Request verification email' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async requestEmailVerification(@Body() payload: RequestEmailVerificationDto): Promise<void> {
    await this._authEmailVerificationService.requestVerificationEmail(payload);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Verify user email' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async verifyEmail(@Body() payload: VerifyEmailDto): Promise<void> {
    await this._authEmailVerificationService.verifyEmail(payload);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async forgotPassword(@Body() payload: ForgotPasswordDto): Promise<void> {
    await this._authPasswordRecoveryService.forgotPassword(payload);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset password using recovery token' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async resetPassword(@Body() payload: ResetPasswordDto): Promise<void> {
    await this._authPasswordRecoveryService.resetPassword(payload);
  }
}
