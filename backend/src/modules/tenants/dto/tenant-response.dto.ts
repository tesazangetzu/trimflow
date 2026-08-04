import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TenantResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  settings?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;
}