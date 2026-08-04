import { Global, Module } from '@nestjs/common';
import { TrimflowLoggerService } from './trimflow-logger.service';

@Global()
@Module({
  providers: [TrimflowLoggerService],
  exports: [TrimflowLoggerService],
})
export class TrimflowLoggerModule {}
