import { DatabaseModule } from '@modules/database/database.module';
import { SecurityModule } from '@modules/security/security.module';
import { Module } from '@nestjs/common';
import { RolesGuard, SelfGuard } from '@/modules/auth/guards';
import { UsersAdminController, UsersProfileController } from './controllers';
import { PrismaUsersRepository, UsersRepository } from './repositories';
import {
  UsersCreateService,
  UsersEventsService,
  UsersGetByEmailService,
  UsersGetByIdService,
  UsersGetMeService,
  UsersListService,
  UsersUpdatePasswordService,
  UsersUpdateService,
} from './services';

/**
 * Users module wiring.
 */
@Module({
  imports: [DatabaseModule, SecurityModule],
  controllers: [UsersProfileController, UsersAdminController],
  providers: [
    UsersCreateService,
    UsersUpdateService,
    UsersUpdatePasswordService,
    UsersGetByEmailService,
    UsersGetByIdService,
    UsersGetMeService,
    UsersListService,
    UsersEventsService,
    RolesGuard,
    SelfGuard,
    {
      provide: UsersRepository,
      useClass: PrismaUsersRepository,
    },
  ],
  exports: [
    UsersCreateService,
    UsersUpdateService,
    UsersUpdatePasswordService,
    UsersGetByEmailService,
    UsersGetByIdService,
    UsersGetMeService,
    UsersListService,
    UsersEventsService,
    UsersRepository,
  ],
})
export class UsersModule {}
