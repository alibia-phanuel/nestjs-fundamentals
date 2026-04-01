import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // ✅ ValidationPipe — valide les DTOs
  app.useGlobalPipes(new ValidationPipe());
  // ✅ ClassSerializerInterceptor — active @Exclude() globalement
  // Sans ça → @Exclude() ne fonctionne pas !
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
