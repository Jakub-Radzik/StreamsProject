import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaService } from './kafka.service';
import { DataHandlerService } from './data-handler.service';
import { ElasticsearchModule } from 'src/elasticsearch/elasticsearch.module';
import { UtilsModule } from 'src/utils/utils.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: 'test-consumer',
            allowAutoTopicCreation: true,
          },
        },
      },
    ]),
    ElasticsearchModule,
    UtilsModule,
  ],
  providers: [KafkaService, DataHandlerService],
})
export class KafkaModule {}
