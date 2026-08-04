import { Body, Controller, Get, Post, Patch, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ScheduleService } from '../services/schedule.service';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { UpdateScheduleDto } from '../dto/update-schedule.dto';
import { CreateBlockDto } from '../dto/create-block.dto';
import { UpdateBlockDto } from '../dto/update-block.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';

@ApiTags('Schedule')
@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ScheduleController {
  constructor(private scheduleService: ScheduleService) {}

  // ─── Rutas de blocks (estáticas, deben ir ANTES que :id) ───

  @Post('blocks')
  @Roles('super-admin', 'admin', 'barber')
  @ApiOperation({ summary: 'Crear bloqueo de disponibilidad' })
  createBlock(@Body() dto: CreateBlockDto) {
    return this.scheduleService.createBlock(dto);
  }

  @Get('blocks')
  @Roles('super-admin', 'admin', 'barber')
  @ApiOperation({ summary: 'Listar bloqueos' })
  @ApiQuery({ name: 'barberId', required: false })
  findAllBlocks(@Query('barberId') barberId?: string) {
    return this.scheduleService.findAllBlocks(barberId);
  }

  @Get('blocks/:id')
  @Roles('super-admin', 'admin', 'barber')
  @ApiOperation({ summary: 'Obtener bloqueo por ID' })
  findOneBlock(@Param('id') id: string) {
    return this.scheduleService.findOneBlock(id);
  }

  @Patch('blocks/:id')
  @Roles('super-admin', 'admin', 'barber')
  @ApiOperation({ summary: 'Actualizar bloqueo' })
  updateBlock(@Param('id') id: string, @Body() dto: UpdateBlockDto) {
    return this.scheduleService.updateBlock(id, dto);
  }

  @Delete('blocks/:id')
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Eliminar bloqueo' })
  removeBlock(@Param('id') id: string) {
    return this.scheduleService.removeBlock(id);
  }

  // ─── Rutas de horarios (con :id, van después de las estáticas) ───

  @Post()
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Crear horario regular' })
  create(@Body() dto: CreateScheduleDto) {
    return this.scheduleService.create(dto);
  }

  @Get()
  @Roles('super-admin', 'admin', 'barber')
  @ApiOperation({ summary: 'Listar horarios regulares' })
  @ApiQuery({ name: 'barberId', required: false })
  findAll(@Query('barberId') barberId?: string) {
    return this.scheduleService.findAll(barberId);
  }

  @Get(':id')
  @Roles('super-admin', 'admin', 'barber')
  @ApiOperation({ summary: 'Obtener horario por ID' })
  findOne(@Param('id') id: string) {
    return this.scheduleService.findOne(id);
  }

  @Patch(':id')
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Actualizar horario' })
  update(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    return this.scheduleService.update(id, dto);
  }

  @Delete(':id')
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Eliminar horario' })
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(id);
  }
}
