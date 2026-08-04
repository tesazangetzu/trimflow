import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentService } from './services/appointment.service';
import { AppointmentController } from './controllers/appointment.controller';
import { BarbersModule } from '../barbers/barbers.module';
import { CustomersModule } from '../customers/customers.module';
import { ServicesModule } from '../services/services.module';
import { ScheduleModule } from '../schedule/schedule.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment]),
    BarbersModule,
    CustomersModule,
    ServicesModule,
    ScheduleModule,
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentsModule {}
