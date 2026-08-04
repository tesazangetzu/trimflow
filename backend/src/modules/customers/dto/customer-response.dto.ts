import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Carlos López' })
  name: string;

  @ApiPropertyOptional({ example: 'carlos@email.com' })
  email?: string;

  @ApiPropertyOptional({ example: '+56998765432' })
  phone?: string;

  @ApiPropertyOptional({ example: 'Cliente prefiere cortes clásicos' })
  notes?: string;

  @ApiProperty({ example: 'uuid-of-branch' })
  branchId: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: null })
  deletedAt?: Date;
}
