import { IsUUID, IsOptional, IsDateString, IsString, IsEmail, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePublicAppointmentDto {
  @ApiProperty({ example: 'uuid-del-servicio' })
  @IsUUID()
  serviceId: string;

  @ApiPropertyOptional({ example: 'uuid-del-barbero' })
  @IsOptional()
  @IsUUID()
  barberId?: string;

  @ApiProperty({ example: '2026-08-04T10:00:00Z', description: 'Inicio de la cita (ISO 8601)' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: 'Carlos López' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'carlos@email.com', description: 'Email obligatorio del cliente' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+56998765432' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ example: 'Confirmar 24h antes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
