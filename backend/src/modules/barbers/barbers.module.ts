import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Barber } from './entities/barber.entity';
import { BarberService } from './services/barber.service';
import { BarberController } from './controllers/barber.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Barber])],
  controllers: [BarberController],
  providers: [BarberService],
  exports: [BarberService],
})
export class BarbersModule {}
