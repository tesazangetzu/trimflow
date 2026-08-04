import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AppointmentResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: '2026-07-28T10:00:00.000Z' })
  startTime: Date;

  @ApiProperty({ example: '2026-07-28T10:30:00.000Z' })
  endTime: Date;

  @ApiProperty({ enum: ['scheduled', 'completed', 'cancelled', 'no-show'] })
  status: string;

  @ApiPropertyOptional({ example: 'Confirmar 24h antes' })
  notes?: string;

  @ApiProperty({ example: 'uuid-del-barbero' })
  barberId: string;

  @ApiProperty({ example: 'uuid-del-cliente' })
  customerId: string;

  @ApiProperty({ example: 'uuid-del-servicio' })
  serviceId: string;

  @ApiProperty({ example: '2026-07-28T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-28T00:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: null })
  deletedAt?: Date;
}
