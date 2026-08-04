import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BarberResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Juan Pérez' })
  name: string;

  @ApiProperty({ example: 'juan@barberia.com' })
  email: string;

  @ApiPropertyOptional({ example: '+56912345678' })
  phone?: string;

  @ApiProperty({ example: 'uuid-de-la-sucursal' })
  branchId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;
}
