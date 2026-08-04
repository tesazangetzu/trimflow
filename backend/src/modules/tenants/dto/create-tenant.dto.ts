import { IsString, IsEmail, IsOptional, IsObject, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'Barbería El Clásico', description: 'Nombre del tenant' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'barberia-el-clasico', description: 'Slug único del tenant' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  slug: string;

  @ApiPropertyOptional({ example: 'contacto@barberia.com', description: 'Email de contacto' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Configuración adicional del tenant' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}