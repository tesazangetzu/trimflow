import { IsString, IsEmail, IsOptional, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Carlos López', description: 'Nombre del cliente' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'carlos@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+56998765432' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ example: 'Cliente prefiere cortes clásicos' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'uuid-of-branch', description: 'ID de la sucursal' })
  @IsUUID()
  branchId: string;
}
