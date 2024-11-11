import { Module } from '@nestjs/common';
import { PortScanService } from './port-scan.service';
import { ElasticsearchModule } from 'src/elasticsearch/elasticsearch.module';
import { FloodDetectionService } from './flood-detection.service';
import { PortScanSchedulerService } from './port-scan-scheduler.service';

@Module({
  exports: [PortScanService, FloodDetectionService],
  imports: [ElasticsearchModule],
  providers: [PortScanService, FloodDetectionService, PortScanSchedulerService],
})
export class DetectionModule {}
