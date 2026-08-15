import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantService } from '../services/tenant.service';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { MyTenantResponseDto } from '../dto/my-tenant-response.dto';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @Post()
  @Roles('super-admin')
  @ApiOperation({ summary: 'Crear tenant', description: 'Solo Super Admin. Crea una nueva barbería.' })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantService.create(createTenantDto);
  }

  @Get()
  @Roles('super-admin')
  @ApiOperation({ summary: 'Listar tenants' })
  findAll() {
    return this.tenantService.findAll();
  }

  @Get('me')
  @Roles('admin', 'barber')
  @ApiOperation({
    summary: 'Obtener el tenant propio',
    description: 'Devuelve { id, name } del tenant del token. Solo Admin y Barber.',
  })
  async findMyTenant(@CurrentUser('tenantId') tenantId?: string): Promise<MyTenantResponseDto> {
    const tenant = await this.tenantService.findMyTenant(tenantId!);
    const dto = new MyTenantResponseDto();
    dto.id = tenant.id;
    dto.name = tenant.name;
    return dto;
  }

  @Get(':id')
  @Roles('super-admin')
  @ApiOperation({ summary: 'Obtener tenant por ID' })
  findOne(@Param('id') id: string) {
    return this.tenantService.findOne(id);
  }

  @Patch(':id')
  @Roles('super-admin')
  @ApiOperation({ summary: 'Actualizar tenant' })
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @Roles('super-admin')
  @ApiOperation({ summary: 'Eliminar tenant' })
  remove(@Param('id') id: string) {
    return this.tenantService.remove(id);
  }

  @Post(':id/activate')
  @Roles('super-admin')
  @ApiOperation({ summary: 'Activar tenant' })
  activate(@Param('id') id: string) {
    return this.tenantService.activate(id);
  }

  @Post(':id/suspend')
  @Roles('super-admin')
  @ApiOperation({ summary: 'Suspender tenant' })
  suspend(@Param('id') id: string) {
    return this.tenantService.suspend(id);
  }
}