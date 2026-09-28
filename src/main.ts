import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarApp } from './app.setup';
import { configurarSwagger } from './common/swagger/swagger.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configurarApp(app);

  if (process.env.SWAGGER_ENABLED !== 'false') {
    configurarSwagger(app);
  }

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
