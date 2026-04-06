import authConfig from '@/config/auth.config';
import { DatabaseModule } from '@modules/database/database.module';
import { SecurityModule } from '@modules/security/security.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import type { ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers';
import { AuthUsersEventsListener } from './listeners';
import { AuthRepository, PrismaAuthRepository } from './repositories';
import {
  AuthEmailVerificationService,
  AuthEventsService,
  AuthPasswordRecoveryService,
  AuthRefreshService,
  AuthSignInService,
  AuthSignOutService,
  AuthSignUpService,
  AuthUserCreatedVerificationService,
  JwtTokenService,
  RefreshTokenService,
} from './services';
import { JwtStrategy } from './strategies';

/**
 * Auth module wiring.
 */
@Module({
  imports: [
    DatabaseModule,
    SecurityModule,
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
    AuthUserCreatedVerificationService,
    AuthEventsService,
    JwtTokenService,
    RefreshTokenService,
    JwtStrategy,
    AuthUsersEventsListener,
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
    AuthEventsService,
    JwtTokenService,
    RefreshTokenService,
    JwtStrategy,
    AuthRepository,
  ],
})
export class AuthModule {}
