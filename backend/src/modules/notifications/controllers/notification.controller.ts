import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from '../services/notification.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Post()
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Crear notificación' })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.create(dto);
  }

  @Get()
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Listar notificaciones' })
  findAll() {
    return this.notificationService.findAll();
  }

  @Get(':id')
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Obtener notificación' })
  findOne(@Param('id') id: string) {
    return this.notificationService.findOne(id);
  }

  @Patch(':id/sent')
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Marcar como enviada' })
  markAsSent(@Param('id') id: string) {
    return this.notificationService.markAsSent(id);
  }

  @Delete(':id')
  @Roles('super-admin')
  @ApiOperation({ summary: 'Eliminar notificación' })
  remove(@Param('id') id: string) {
    return this.notificationService.remove(id);
  }
}
