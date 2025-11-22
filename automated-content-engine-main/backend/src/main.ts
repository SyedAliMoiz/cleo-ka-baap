import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as express from 'express';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Configure Socket.IO adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Set up Helmet for securing HTTP headers
  app.use(helmet());

  // Environment-aware CORS configuration
  const environment = configService.get('NODE_ENV', 'development');
  const allowedOrigins = configService.get(
    'ALLOWED_ORIGINS',
    'http://localhost:3000',
  );

  // Always include both localhost and the production domain
  const originsArray = allowedOrigins.split(',').map((origin) => origin.trim());

  // Ensure production domain is included
  if (!originsArray.includes('https://ace.vyralab.com')) {
    originsArray.push('https://ace.vyralab.com');
  }

  logger.log(`Environment: ${environment}`);
  logger.log(`Allowed Origins: ${originsArray.join(', ')}`);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || originsArray.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.warn(`Blocked request from unauthorized origin: ${origin}`);
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400, // 24 hours for preflight cache
  });

  // Configure global validation pipe with stricter settings
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties present
      transform: true, // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: false, // Require explicit type transformations
      },
      forbidUnknownValues: true, // Reject unknown objects outright
    }),
  );

  // Increase JSON size limit and add security timeouts
  app.use(
    express.json({
      limit: '10mb',
      verify: (req, res, buf, encoding) => {
        if (buf.length > 10 * 1024 * 1024) {
          // Double-check 10MB limit
          throw new Error('Request body too large');
        }
      },
    }),
  );

  // Set request timeout
  app.use((req, res, next) => {
    res.setTimeout(60000, () => {
      // 60 second timeout
      res.status(408).send('Request Timeout');
    });
    next();
  });

  const port = configService.get('PORT', 4000);
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
}
bootstrap();
