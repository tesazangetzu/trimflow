import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { TrimflowLoggerService } from '../../../shared/logger';
import { R2StorageInterface } from '../interfaces/r2-storage.interface';

@Injectable()
export class R2StorageService implements R2StorageInterface, OnModuleInit, OnModuleDestroy {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly accountId: string;

  constructor(
    private configService: ConfigService,
    private logger: TrimflowLoggerService,
  ) {
    this.logger.setContext('R2StorageService');
    this.accountId = this.configService.get<string>('R2_ACCOUNT_ID')!;
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID')!;
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY')!;
    this.bucket = this.configService.get<string>('R2_BUCKET')!;

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async onModuleInit(): Promise<void> {
    this.logger.log(`R2StorageService inicializado (bucket ${this.bucket})`);
  }

  async onModuleDestroy(): Promise<void> {
    this.client.destroy();
  }

  async upload(input: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<{ key: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    });
    await this.client.send(command);
    this.logger.log(`Objeto subido a R2: ${input.key}`);
    return { key: input.key };
  }
}