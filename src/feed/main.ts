import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { FeedModule } from './feed.module';
import { FeedService } from './feed.service';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(FeedModule);
  const runScriptService = appContext.get(FeedService);
  runScriptService.runScript();
  await appContext.close();
}

bootstrap();
