import { Module } from '@nestjs/common';
import { PortScanService } from './port-scan.service';
import { ElasticsearchModule } from 'src/elasticsearch/elasticsearch.module';
import { FloodDetectionService } from './flood-detection.service';
import { PortScanSchedulerService } from './port-scan-scheduler.service';
import { DnsAmplificationDetectionService } from './dns-amplification.service';
import { PacketSizeService } from './analysis-services/packet-size.service';
import { StandardDeviationAnalysisService } from './analysis-services/analysis.service';
import { KnnService } from './knn.service';
import { PacketRateService } from './analysis-services/packet-rate.service';
import { BloomFilterService } from './bloom-filter.service';
import { LenDportCorrelationService } from './lendport-corr.service';

@Module({
  exports: [
    PortScanService,
    FloodDetectionService,
    DnsAmplificationDetectionService,
    StandardDeviationAnalysisService,
    KnnService,
    BloomFilterService,
    LenDportCorrelationService,
  ],
  imports: [ElasticsearchModule],
  providers: [
    PortScanService,
    FloodDetectionService,
    PortScanSchedulerService,
    DnsAmplificationDetectionService,
    PacketSizeService,
    PacketRateService,
    StandardDeviationAnalysisService,
    KnnService,
    BloomFilterService,
    LenDportCorrelationService,
  ],
})
export class DetectionModule {}
