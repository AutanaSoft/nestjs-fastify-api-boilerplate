import { DatabaseModule } from '@modules/database/database.module';
import { SecurityModule } from '@modules/security/security.module';
import { Module } from '@nestjs/common';
import { UsersController } from './controllers';
import { PrismaUsersRepository, UsersRepository } from './repositories';
import {
  UsersEventsService,
  UsersReadService,
  UsersSecurityService,
  UsersWriteService,
} from './services';

@Module({
  imports: [DatabaseModule, SecurityModule],
  controllers: [UsersController],
  providers: [
    UsersWriteService,
    UsersReadService,
    UsersSecurityService,
    UsersEventsService,
    {
      provide: UsersRepository,
      useClass: PrismaUsersRepository,
    },
  ],
  exports: [
    UsersWriteService,
    UsersReadService,
    UsersSecurityService,
    UsersEventsService,
    UsersRepository,
  ],
})
export class UsersModule {}
