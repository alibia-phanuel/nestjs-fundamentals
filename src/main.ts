/* eslint-disable @typescript-eslint/no-misused-promises */
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ValidationPipe,
  ClassSerializerInterceptor,
  Logger,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// ✅ Doit être en haut du fichier
declare const module: NodeModule & {
  hot?: {
    accept: () => void;
    dispose: (callback: () => void) => void;
  };
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap'); // ✅ Logger ajouté

  // ✅ ValidationPipe strict
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // ← supprime les champs non déclarés
      forbidNonWhitelisted: true, // ← erreur si champs inconnus envoyés
      transform: true, // ← convertit string → number automatiquement
    }),
  );

  // ✅ ClassSerializerInterceptor — active @Exclude() globalement
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // ✅ CORS — obligatoire pour les apps frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY'],
  });

  // ✅ Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('NestJS Fundamentals API')
    .setDescription('Documentation complète de notre API Spotify Clone')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Entre ton token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    // ✅ Ajoute le support API Key dans Swagger
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-KEY',
        in: 'header',
        description: 'Entre ton API Key',
      },
      'X-API-KEY',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // ← garde le token entre les refreshs
    },
  });

  // ✅ Hot Module Reloading — uniquement en développement
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  // ✅ Logs de démarrage
  logger.log(`🚀 Application démarrée sur le port ${String(port)}`);
  logger.log(`📚 Swagger disponible sur http://localhost:${String(port)}/api`);
}

bootstrap();
