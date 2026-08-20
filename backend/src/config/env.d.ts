declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'staging' | 'production';
    PORT: string;
    DATABASE_URL: string;
    REDIS_URL: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_EXPIRES_IN?: string;
    JWT_REFRESH_EXPIRES_IN?: string;
    API_PREFIX?: string;
    CORS_ORIGINS?: string;
    LOG_LEVEL?: string;
    SENTRY_DSN?: string;
    SMTP_HOST?: string;
    SMTP_PORT?: string;
    SMTP_USER?: string;
    SMTP_PASS?: string;
    SMTP_FROM?: string;
    TENANT_DB_SCHEMA_PREFIX?: string;
    RATE_LIMIT_TTL?: string;
    RATE_LIMIT_MAX?: string;
    R2_ACCOUNT_ID: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    R2_BUCKET: string;
    R2_PUBLIC_URL?: string;
  }
}
