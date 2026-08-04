import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

export function createWinstonLogger(configService: ConfigService, context?: string): winston.Logger {
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const level = configService.get<string>('LOG_LEVEL', nodeEnv === 'production' ? 'info' : 'debug');
  const isDev = nodeEnv === 'development';

  const devFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.ms(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ms, context: ctx, stack }) => {
      return `${timestamp} [${level}] [${ctx || 'Application'}] ${message} ${ms}${stack ? '\n' + stack : ''}`;
    }),
  );

  const prodFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.ms(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  );

  return winston.createLogger({
    level,
    defaultMeta: {
      service: 'trimflow-api',
      context: context || 'Application',
    },
    format: isDev ? devFormat : prodFormat,
    transports: [new winston.transports.Console()],
  });
}
