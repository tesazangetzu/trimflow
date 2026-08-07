import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import { LandingService } from './services/landing.service';
import { LandingController } from './controllers/landing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  controllers: [LandingController],
  providers: [LandingService],
  exports: [LandingService],
})
export class LandingModule {}
