import { Module } from '@nestjs/common';
import { ReceiverController } from './receiver.controller';
import { ReceiverService } from './receiver.service';
import { NetworkService } from './network.service';
import { DetectionModule } from 'src/detection/detection.module';
import { ElasticsearchModule } from 'src/elasticsearch/elasticsearch.module';

@Module({
  controllers: [ReceiverController],
  imports: [DetectionModule, ElasticsearchModule],
  providers: [ReceiverService, NetworkService],
})
export class ReceiverModule {}
