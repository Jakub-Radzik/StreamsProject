import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [FeedService],
})
export class FeedModule {}
