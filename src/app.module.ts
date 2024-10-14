import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from './kafka/kafka.module';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module';
import { UtilsModule } from './utils/utils.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    KafkaModule,
    ElasticsearchModule,
    UtilsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
