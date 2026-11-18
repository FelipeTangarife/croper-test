import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

export function configureApp(app: INestApplication) {
  const config = app.get(ConfigService);

  app.use(helmet());
  app.enableCors({ origin: config.getOrThrow<string>('CORS_ORIGIN') });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Products API')
    .setDescription('Product management API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
    { swaggerOptions: { persistAuthorization: true } },
  );
}
