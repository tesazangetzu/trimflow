import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJhbGciOi...', description: 'Refresh token' })
  @IsString()
  refreshToken: string;
}
