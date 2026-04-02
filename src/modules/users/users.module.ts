import { DatabaseModule } from '@modules/database/database.module';
import { SecurityModule } from '@modules/security/security.module';
import { Module } from '@nestjs/common';
import { UsersController } from './controllers';
import { PrismaUsersRepository, UsersRepository } from './repositories';
import {
  UsersCreateService,
  UsersEventsService,
  UsersGetByEmailService,
  UsersGetByIdService,
  UsersListService,
  UsersUpdatePasswordService,
  UsersUpdateService,
} from './services';

@Module({
  imports: [DatabaseModule, SecurityModule],
  controllers: [UsersController],
  providers: [
    UsersCreateService,
    UsersUpdateService,
    UsersUpdatePasswordService,
    UsersGetByEmailService,
    UsersGetByIdService,
    UsersListService,
    UsersEventsService,
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
    UsersListService,
    UsersEventsService,
    UsersRepository,
  ],
})
export class UsersModule {}
