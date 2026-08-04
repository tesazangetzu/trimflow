import { IsString, IsEmail, IsOptional, MinLength, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBarberDto {
  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre del barbero' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'juan@barberia.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+56912345678' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiProperty({ example: 'uuid-de-la-sucursal' })
  @IsUUID()
  branchId: string;
}
