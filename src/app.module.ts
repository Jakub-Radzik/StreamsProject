import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from './kafka/kafka.module';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module';
import { ReceiverModule } from './receiver/receiver.module';
import configuration from './config/configuration';
import { CacheModule } from '@nestjs/cache-manager';
import { DetectionModule } from './detection/detection.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    KafkaModule,
    ElasticsearchModule,
    DetectionModule,
    ReceiverModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
