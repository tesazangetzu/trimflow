import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BranchService } from '../services/branch.service';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { UpdateBranchDto } from '../dto/update-branch.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';

@ApiTags('Branches')
@ApiBearerAuth()
@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchController {
  constructor(private branchService: BranchService) {}

  @Post()
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Crear sucursal' })
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchService.create(createBranchDto);
  }

  @Get()
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Listar sucursales' })
  findAll(@Query('tenantId') tenantId?: string) {
    return this.branchService.findAll(tenantId);
  }

  @Get(':id')
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Obtener sucursal por ID' })
  findOne(@Param('id') id: string) {
    return this.branchService.findOne(id);
  }

  @Patch(':id')
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Actualizar sucursal' })
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchService.update(id, updateBranchDto);
  }

  @Delete(':id')
  @Roles('super-admin')
  @ApiOperation({ summary: 'Eliminar sucursal' })
  remove(@Param('id') id: string) {
    return this.branchService.remove(id);
  }
}
