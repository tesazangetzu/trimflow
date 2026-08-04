import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingService } from '../services/setting.service';
import { SetSettingDto } from '../dto/set-setting.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingController {
  constructor(private settingService: SettingService) {}

  @Get()
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Obtener todos los settings' })
  getAll(@Query('branchId') branchId?: string) {
    return this.settingService.getAll(branchId);
  }

  @Get(':key')
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Obtener un setting por key' })
  get(@Param('key') key: string, @Query('branchId') branchId?: string) {
    return this.settingService.get(key, branchId);
  }

  @Post()
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Crear o actualizar un setting' })
  set(@Body() dto: SetSettingDto) {
    return this.settingService.set(dto.key, dto.value, dto.branchId, dto.description);
  }

  @Delete(':key')
  @Roles('super-admin')
  @ApiOperation({ summary: 'Eliminar un setting' })
  delete(@Param('key') key: string, @Query('branchId') branchId?: string) {
    return this.settingService.delete(key, branchId);
  }
}
