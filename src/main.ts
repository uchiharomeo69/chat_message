import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT || 4000).then(() => {
    console.log(`start at ${process.env.PORT || 4000}`);
  });
}
bootstrap();
