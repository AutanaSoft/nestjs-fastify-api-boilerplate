import authConfig from '@/config/auth.config';
import { DatabaseModule } from '@modules/database/database.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import type { ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers';
import { AuthRepository, PrismaAuthRepository } from './repositories';
import {
  AuthEmailVerificationService,
  AuthEventsService,
  AuthMeService,
  AuthPasswordRecoveryService,
  AuthRefreshService,
  AuthSignInService,
  AuthSignOutService,
  AuthSignUpService,
  JwtTokenService,
  PasswordHashService,
  RefreshTokenService,
} from './services';
import { JwtStrategy } from './strategies';

/**
 * Auth module wiring.
 */
@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [authConfig.KEY],
      useFactory: (config: ConfigType<typeof authConfig>) => ({
        secret: config.AUTH_JWT_SECRET,
        signOptions: {
          issuer: config.AUTH_JWT_ISSUER,
          audience: config.AUTH_JWT_AUDIENCE,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthSignUpService,
    AuthSignInService,
    AuthRefreshService,
    AuthSignOutService,
    AuthEmailVerificationService,
    AuthPasswordRecoveryService,
    AuthMeService,
    AuthEventsService,
    JwtTokenService,
    RefreshTokenService,
    PasswordHashService,
    JwtStrategy,
    {
      provide: AuthRepository,
      useClass: PrismaAuthRepository,
    },
  ],
  exports: [
    AuthSignUpService,
    AuthSignInService,
    AuthRefreshService,
    AuthSignOutService,
    AuthEmailVerificationService,
    AuthPasswordRecoveryService,
    AuthMeService,
    AuthEventsService,
    JwtTokenService,
    RefreshTokenService,
    PasswordHashService,
    AuthRepository,
  ],
})
export class AuthModule {}
