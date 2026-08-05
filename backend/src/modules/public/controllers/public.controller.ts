import { Controller, Get, Post, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { PublicService } from '../services/public.service';
import { AvailabilityService } from '../services/availability.service';
import { PublicBookingService } from '../services/public-booking.service';
import { AvailabilityQueryDto } from '../dto/availability-query.dto';
import { CustomerLookupDto } from '../dto/customer-lookup.dto';
import { CreatePublicAppointmentDto } from '../dto/create-public-appointment.dto';

@ApiTags('Public')
@ApiParam({ name: 'slug', description: 'Slug público de la barbería' })
@Controller('public/:slug')
export class PublicController {
  constructor(
    private publicService: PublicService,
    private availabilityService: AvailabilityService,
    private bookingService: PublicBookingService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Metadatos públicos de la barbería (sin JWT)' })
  getShop(@Param('slug') slug: string) {
    return this.publicService.getPublicShop(slug);
  }

  @Get('availability')
  @ApiOperation({ summary: 'Cálculo de disponibilidad (sin JWT)' })
  getAvailability(@Param('slug') slug: string, @Query() query: AvailabilityQueryDto) {
    return this.availabilityService.getAvailability(slug, query.serviceId, query.barberId, query.date);
  }

  @Post('customers/lookup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autocompletar cliente por email (sin JWT)' })
  lookupCustomer(@Param('slug') slug: string, @Body() dto: CustomerLookupDto) {
    return this.bookingService.lookupCustomer(slug, dto);
  }

  @Post('appointments')
  @ApiOperation({ summary: 'Crear reserva pública (sin JWT)' })
  createAppointment(@Param('slug') slug: string, @Body() dto: CreatePublicAppointmentDto) {
    return this.bookingService.createAppointment(slug, dto);
  }
}