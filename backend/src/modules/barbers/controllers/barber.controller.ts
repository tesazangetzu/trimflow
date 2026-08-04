import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BarberService } from '../services/barber.service';
import { CreateBarberDto } from '../dto/create-barber.dto';
import { UpdateBarberDto } from '../dto/update-barber.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';

@ApiTags('Barbers')
@ApiBearerAuth()
@Controller('barbers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BarberController {
  constructor(private barberService: BarberService) {}

  @Post()
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Crear barbero' })
  create(@Body() createBarberDto: CreateBarberDto) {
    return this.barberService.create(createBarberDto);
  }

  @Get()
  @Roles('super-admin', 'admin', 'barber')
  @ApiOperation({ summary: 'Listar barberos' })
  findAll(@Query('branchId') branchId?: string) {
    return this.barberService.findAll(branchId);
  }

  @Get(':id')
  @Roles('super-admin', 'admin', 'barber')
  @ApiOperation({ summary: 'Obtener barbero por ID' })
  findOne(@Param('id') id: string) {
    return this.barberService.findOne(id);
  }

  @Patch(':id')
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Actualizar barbero' })
  update(@Param('id') id: string, @Body() updateBarberDto: UpdateBarberDto) {
    return this.barberService.update(id, updateBarberDto);
  }

  @Delete(':id')
  @Roles('super-admin')
  @ApiOperation({ summary: 'Eliminar barbero' })
  remove(@Param('id') id: string) {
    return this.barberService.remove(id);
  }
}
