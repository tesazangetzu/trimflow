import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScheduleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  barberId: string;

  @ApiProperty()
  dayOfWeek: number;

  @ApiProperty()
  startTime: string;

  @ApiProperty()
  endTime: string;

  @ApiPropertyOptional()
  breakStartTime?: string;

  @ApiPropertyOptional()
  breakEndTime?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
