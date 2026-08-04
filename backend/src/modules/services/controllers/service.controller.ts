import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ServiceService } from '../services/service.service';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';

@ApiTags('Services')
@ApiBearerAuth()
@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiceController {
  constructor(private serviceService: ServiceService) {}

  @Post()
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Crear servicio' })
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.serviceService.create(createServiceDto);
  }

  @Get()
  @Roles('super-admin', 'admin', 'barber')
  @ApiOperation({ summary: 'Listar servicios' })
  @ApiQuery({ name: 'branchId', required: false })
  findAll(@Query('branchId') branchId?: string) {
    return this.serviceService.findAll(branchId);
  }

  @Get(':id')
  @Roles('super-admin', 'admin', 'barber')
  @ApiOperation({ summary: 'Obtener servicio por ID' })
  findOne(@Param('id') id: string) {
    return this.serviceService.findOne(id);
  }

  @Patch(':id')
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Actualizar servicio' })
  update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.serviceService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Eliminar servicio' })
  remove(@Param('id') id: string) {
    return this.serviceService.remove(id);
  }
}
