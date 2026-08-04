import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BranchResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  openingTime?: string;

  @ApiPropertyOptional()
  closingTime?: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;
}
