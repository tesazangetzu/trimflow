import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from './entities/schedule.entity';
import { AvailabilityBlock } from './entities/availability-block.entity';
import { ScheduleService } from './services/schedule.service';
import { ScheduleController } from './controllers/schedule.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule, AvailabilityBlock])],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
