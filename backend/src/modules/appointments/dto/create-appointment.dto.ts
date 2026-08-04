import { IsString, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ example: '2026-07-28T10:00:00Z', description: 'Inicio de la cita (ISO 8601)' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2026-07-28T10:30:00Z', description: 'Fin de la cita (ISO 8601)' })
  @IsDateString()
  endTime: string;

  @ApiProperty({ example: 'uuid-del-barbero' })
  @IsUUID()
  barberId: string;

  @ApiProperty({ example: 'uuid-del-cliente' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: 'uuid-del-servicio' })
  @IsUUID()
  serviceId: string;

  @ApiPropertyOptional({ example: 'Confirmar 24h antes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
