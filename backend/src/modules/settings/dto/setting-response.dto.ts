import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SettingResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() key: string;
  @ApiProperty() value: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() branchId?: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiPropertyOptional() deletedAt?: Date;
}
