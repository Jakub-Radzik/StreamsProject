import { Module } from '@nestjs/common';
import { ReceiverController } from './receiver.controller';
import { ReceiverService } from './receiver.service';
import { DetectionModule } from 'src/detection/detection.module';
import { ElasticsearchModule } from 'src/elasticsearch/elasticsearch.module';
import { PcapNetworkService } from './pcap.network.service';

@Module({
  controllers: [ReceiverController],
  imports: [DetectionModule, ElasticsearchModule],
  providers: [ReceiverService, PcapNetworkService],
})
export class ReceiverModule {}
