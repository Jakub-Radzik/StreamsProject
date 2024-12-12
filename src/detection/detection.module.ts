import { Module } from '@nestjs/common';
import { PortScanService } from './port-scan.service';
import { ElasticsearchModule } from 'src/elasticsearch/elasticsearch.module';
import { FloodDetectionService } from './flood-detection.service';
import { PortScanSchedulerService } from './port-scan-scheduler.service';
import { DnsAmplificationDetectionService } from './dns-amplification.service';
import { PacketSizeService } from './packet-size.service';
import { StandardDeviationAnalysisService } from './analysis.service';
import { KnnService } from './knn.service';

@Module({
  exports: [
    PortScanService,
    FloodDetectionService,
    DnsAmplificationDetectionService,
    StandardDeviationAnalysisService,
    KnnService,
  ],
  imports: [ElasticsearchModule],
  providers: [
    PortScanService,
    FloodDetectionService,
    PortScanSchedulerService,
    DnsAmplificationDetectionService,
    PacketSizeService,
    StandardDeviationAnalysisService,
    KnnService,
  ],
})
export class DetectionModule {}
