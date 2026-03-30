import { DatabaseModule } from '@modules/database/database.module';
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
  imports: [DatabaseModule],
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
