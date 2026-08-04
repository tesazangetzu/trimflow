import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ServiceResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Corte de cabello' })
  name: string;

  @ApiPropertyOptional({ example: 'Corte clásico con tijera' })
  description?: string;

  @ApiProperty({ example: 15000 })
  price: number;

  @ApiProperty({ example: 30 })
  durationMinutes: number;

  @ApiProperty({ example: 'uuid-de-la-sucursal' })
  branchId: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: null })
  deletedAt?: Date;
}
