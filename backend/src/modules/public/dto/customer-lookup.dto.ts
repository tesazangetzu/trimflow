import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CustomerLookupDto {
  @ApiProperty({ example: 'carlos@email.com' })
  @IsEmail()
  email: string;
}
