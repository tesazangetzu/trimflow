import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LandingService } from '../services/landing.service';
import { UpdateLandingConfigDto } from '../dto/update-landing-config.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';

@ApiTags('Landing')
@ApiBearerAuth()
@Controller('landing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LandingController {
  constructor(private landingService: LandingService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({
    summary: 'Obtener configuración de la landing propia',
    description: 'Devuelve { slug, config } con defaults urbano/street fusionados con lo guardado.',
  })
  get(@CurrentUser('tenantId') tenantId?: string) {
    return this.landingService.getConfigWithSlug(tenantId!);
  }

  @Put()
  @Roles('admin')
  @ApiOperation({
    summary: 'Actualizar configuración de la landing propia',
    description: 'Actualización parcial: solo cambia los campos enviados.',
  })
  update(@Body() dto: UpdateLandingConfigDto, @CurrentUser('tenantId') tenantId?: string) {
    return this.landingService.updateConfig(tenantId!, dto);
  }
}