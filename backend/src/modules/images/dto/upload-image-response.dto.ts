import { ApiProperty } from '@nestjs/swagger';

/** Respuesta de una subida de imagen. */
export class UploadImageResponseDto {
  @ApiProperty({ description: 'URL pública de la imagen en R2' })
  url: string;

  @ApiProperty({ description: 'Key del objeto en R2' })
  key: string;

  @ApiProperty({ description: 'MIME type almacenado', example: 'image/png' })
  mimeType: string;

  @ApiProperty({ description: 'Tamaño del archivo en bytes' })
  size: number;

  @ApiProperty({ description: 'Ancho final en píxeles' })
  width: number;

  @ApiProperty({ description: 'Alto final en píxeles' })
  height: number;
}