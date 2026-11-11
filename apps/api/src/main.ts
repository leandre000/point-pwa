import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

async function bootstrap() {
  const logger = new Logger('KIRAKA-API');
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Security headers
  app.use(helmet());
  app.use(cookieParser());

  // Global prefixes and filters
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  logger.log(`KIRAKA API running on http://localhost:${port}/api/v1`);
}

bootstrap();
