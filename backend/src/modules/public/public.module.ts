import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Barber } from '../barbers/entities/barber.entity';
import { Service } from '../services/entities/service.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Customer } from '../customers/entities/customer.entity';
import { TenantsModule } from '../tenants/tenants.module';
import { BranchesModule } from '../branches/branches.module';
import { BarbersModule } from '../barbers/barbers.module';
import { ServicesModule } from '../services/services.module';
import { CustomersModule } from '../customers/customers.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { PublicController } from './controllers/public.controller';
import { PublicService } from './services/public.service';
import { AvailabilityService } from './services/availability.service';
import { PublicBookingService } from './services/public-booking.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, Branch, Barber, Service, Appointment, Customer]),
    TenantsModule,
    BranchesModule,
    BarbersModule,
    ServicesModule,
    CustomersModule,
    ScheduleModule,
  ],
  controllers: [PublicController],
  providers: [PublicService, AvailabilityService, PublicBookingService],
  exports: [PublicService],
})
export class PublicModule {}
