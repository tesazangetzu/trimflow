import { ApiProperty } from '@nestjs/swagger';

export class MyTenantResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}