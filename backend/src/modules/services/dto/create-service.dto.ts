import { IsString, IsNumber, IsOptional, MinLength, MaxLength, Min, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ example: 'Corte de cabello', description: 'Nombre del servicio' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Corte clásico con tijera' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 15000, description: 'Precio en pesos chilenos' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 30, description: 'Duración en minutos' })
  @IsNumber()
  @Min(1)
  durationMinutes: number;

  @ApiProperty({ example: 'uuid-de-la-sucursal' })
  @IsUUID()
  branchId: string;
}
