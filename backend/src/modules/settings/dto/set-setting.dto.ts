import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetSettingDto {
  @ApiProperty() @IsString() key: string;
  @ApiProperty() @IsString() value: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() branchId?: string;
}
