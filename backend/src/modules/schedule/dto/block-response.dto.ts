import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BlockResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  barberId: string;

  @ApiProperty()
  startDateTime: Date;

  @ApiProperty()
  endDateTime: Date;

  @ApiPropertyOptional()
  reason?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
