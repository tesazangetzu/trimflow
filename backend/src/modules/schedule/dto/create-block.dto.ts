import { IsUUID, IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBlockDto {
  @ApiProperty({ example: 'uuid-del-barbero' })
  @IsUUID()
  barberId: string;

  @ApiProperty({ example: '2026-07-28T12:00:00Z' })
  @IsDateString()
  startDateTime: string;

  @ApiProperty({ example: '2026-07-28T13:00:00Z' })
  @IsDateString()
  endDateTime: string;

  @ApiPropertyOptional({ example: 'Almuerzo' })
  @IsOptional()
  @IsString()
  reason?: string;
}
