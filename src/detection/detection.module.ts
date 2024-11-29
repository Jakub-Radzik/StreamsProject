import { Module } from '@nestjs/common';
import { PortScanService } from './port-scan.service';
import { ElasticsearchModule } from 'src/elasticsearch/elasticsearch.module';
import { FloodDetectionService } from './flood-detection.service';
import { PortScanSchedulerService } from './port-scan-scheduler.service';
import { PacketAnalysisService } from './packet-analysis.service';

@Module({
  exports: [PortScanService, FloodDetectionService],
  imports: [ElasticsearchModule],
  providers: [
    PortScanService,
    FloodDetectionService,
    PortScanSchedulerService,
    PacketAnalysisService,
  ],
})
export class DetectionModule {}
