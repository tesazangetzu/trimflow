import { IsUUID, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AvailabilityQueryDto {
  @ApiProperty({ example: 'uuid-del-servicio' })
  @IsUUID()
  serviceId: string;

  @ApiPropertyOptional({ example: 'uuid-del-barbero' })
  @IsOptional()
  @IsUUID()
  barberId?: string;

  @ApiProperty({ example: '2026-08-04', description: 'Fecha (YYYY-MM-DD)' })
  @IsDateString()
  date: string;
}
