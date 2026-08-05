import { IsString, IsEmail, IsOptional, IsObject, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'Barbería El Clásico', description: 'Nombre del tenant' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    example: 'barberia-el-clasico',
    description: 'Slug único del tenant. Si no se envía, se auto-genera desde el nombre.',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be lowercase, alphanumeric, hyphen-separated' })
  slug?: string;

  @ApiPropertyOptional({ example: 'contacto@barberia.com', description: 'Email de contacto' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Configuración adicional del tenant' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}