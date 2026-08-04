import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentService } from '../services/appointment.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';

@ApiTags('Appointments')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentController {
  constructor(private appointmentService: AppointmentService) {}

  @Post()
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Crear cita' })
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentService.create(createAppointmentDto);
  }

  @Get()
  @Roles('super-admin', 'admin', 'barber')
  @ApiOperation({ summary: 'Listar citas' })
  findAll(
    @Query('barberId') barberId?: string,
    @Query('date') date?: string,
  ) {
    return this.appointmentService.findAll(barberId, date);
  }

  @Get(':id')
  @Roles('super-admin', 'admin', 'barber')
  @ApiOperation({ summary: 'Obtener cita por ID' })
  findOne(@Param('id') id: string) {
    return this.appointmentService.findOne(id);
  }

  @Patch(':id')
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Actualizar cita' })
  update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentService.update(id, updateAppointmentDto);
  }

  @Patch(':id/cancel')
  @Roles('super-admin', 'admin', 'barber')
  @ApiOperation({ summary: 'Cancelar cita' })
  cancel(@Param('id') id: string) {
    return this.appointmentService.cancel(id);
  }

  @Patch(':id/complete')
  @Roles('super-admin', 'admin', 'barber')
  @ApiOperation({ summary: 'Completar cita' })
  complete(@Param('id') id: string) {
    return this.appointmentService.complete(id);
  }

  @Delete(':id')
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Eliminar cita' })
  remove(@Param('id') id: string) {
    return this.appointmentService.remove(id);
  }
}
