import { Module } from '@nestjs/common';
import { DatabaseModule } from '@modules/database/database.module';
import { SettingsController } from './controllers';
import { SettingsReadService, SettingsWriteService } from './services';

@Module({
  imports: [DatabaseModule],
  controllers: [SettingsController],
  providers: [SettingsReadService, SettingsWriteService],
  exports: [SettingsReadService], // Export only ReadService assuming other modules only need to read settings
})
export class SettingsModule {}
