import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { ImageTarget } from '../constants/image-policy';

/** Query param del target de subida (`logo` | `hero`). */
export class UploadTargetDto {
  @ApiProperty({
    description: 'Target de uso de la imagen',
    enum: ['logo', 'hero'],
  })
  @IsIn(['logo', 'hero'], { message: 'target debe ser "logo" o "hero"' })
  target: ImageTarget;
}