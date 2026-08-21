import { Inject } from '@nestjs/common';
import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { ImagesServiceInterface, IMAGES_SERVICE } from '../interfaces/images-service.interface';
import { UploadImageResponseDto } from '../dto/upload-image-response.dto';
import { UploadTargetDto } from '../dto/upload-target.dto';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '../constants/image-policy';

@ApiTags('Images')
@ApiBearerAuth()
@Controller('images')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImagesController {
  constructor(
    @Inject(IMAGES_SERVICE) private imagesService: ImagesServiceInterface,
  ) {}

  @Post('upload')
  @Roles('admin')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir una imagen a R2 (genérico)' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE, files: 1 },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_MIME_TYPES)[number])) {
          return cb(new BadRequestException('Tipo de archivo no permitido (png, jpg, webp)'), false);
        }
        cb(null, true);
      },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Query() query: UploadTargetDto,
    @CurrentUser('tenantId') tenantId?: string,
  ): Promise<UploadImageResponseDto> {
    if (!file) {
      throw new BadRequestException('Archivo requerido (campo "file")');
    }
    return this.imagesService.uploadImage({
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalname: file.originalname,
      target: query.target,
      tenantId: tenantId!,
    });
  }
}