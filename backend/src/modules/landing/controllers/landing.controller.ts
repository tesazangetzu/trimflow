import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { LandingService } from '../services/landing.service';
import { UpdateLandingConfigDto } from '../dto/update-landing-config.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import {
  ImagesServiceInterface,
  IMAGES_SERVICE,
} from '../../images/interfaces/images-service.interface';
import { UploadTargetDto } from '../../images/dto/upload-target.dto';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '../../images/constants/image-policy';

@ApiTags('Landing')
@ApiBearerAuth()
@Controller('landing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LandingController {
  constructor(
    private landingService: LandingService,
    @Inject(IMAGES_SERVICE) private imagesService: ImagesServiceInterface,
  ) {}

  @Get()
  @Roles('admin')
  @ApiOperation({
    summary: 'Obtener configuración de la landing propia',
    description: 'Devuelve { slug, config } con defaults urbano/street fusionados con lo guardado.',
  })
  get(@CurrentUser('tenantId') tenantId?: string) {
    return this.landingService.getConfigWithSlug(tenantId!);
  }

  @Put()
  @Roles('admin')
  @ApiOperation({
    summary: 'Actualizar configuración de la landing propia',
    description: 'Actualización parcial: solo cambia los campos enviados.',
  })
  update(@Body() dto: UpdateLandingConfigDto, @CurrentUser('tenantId') tenantId?: string) {
    return this.landingService.updateConfig(tenantId!, dto);
  }

  @Post('branding/upload')
  @Roles('admin')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Subir imagen de branding (logo/hero) y persistir su URL',
    description:
      'multipart/form-data con campo "file" y query target=logo|hero. Sube a R2 y persiste la URL en Tenant.settings.landing.branding.',
  })
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
  async uploadBrandingImage(
    @UploadedFile() file: Express.Multer.File,
    @Query() query: UploadTargetDto,
    @CurrentUser('tenantId') tenantId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo requerido (campo "file")');
    }

    const result = await this.imagesService.uploadImage({
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalname: file.originalname,
      target: query.target,
      tenantId: tenantId!,
    });

    const field = query.target === 'logo' ? 'logoUrl' : 'heroImageUrl';
    const config = await this.landingService.setBrandingImageUrl(tenantId!, field, result.url);

    return { url: result.url, key: result.key, config };
  }
}