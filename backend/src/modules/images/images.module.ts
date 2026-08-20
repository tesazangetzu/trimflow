import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ImagesService } from './services/images.service';
import { R2StorageService } from './services/r2-storage.service';
import { ImageValidatorService } from './services/image-validator.service';
import { ImagesController } from './controllers/images.controller';
import { IMAGES_SERVICE } from './interfaces/images-service.interface';
import { R2_STORAGE } from './interfaces/r2-storage.interface';
import { IMAGE_VALIDATOR } from './interfaces/image-validator.interface';

@Module({
  imports: [ConfigModule],
  controllers: [ImagesController],
  providers: [
    {
      provide: IMAGES_SERVICE,
      useClass: ImagesService,
    },
    {
      provide: R2_STORAGE,
      useClass: R2StorageService,
    },
    {
      provide: IMAGE_VALIDATOR,
      useClass: ImageValidatorService,
    },
  ],
  exports: [IMAGES_SERVICE],
})
export class ImagesModule {}