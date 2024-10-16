import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from './kafka/kafka.module';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module';
import { ReceiverModule } from './receiver/receiver.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    KafkaModule,
    ElasticsearchModule,
    ReceiverModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
