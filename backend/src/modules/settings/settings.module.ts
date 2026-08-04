import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from './entities/setting.entity';
import { SettingService } from './services/setting.service';
import { SettingController } from './controllers/setting.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Setting])],
  controllers: [SettingController],
  providers: [SettingService],
  exports: [SettingService],
})
export class SettingsModule {}
