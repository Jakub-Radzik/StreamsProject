import { Injectable } from '@nestjs/common';
import { PortScanService } from 'src/detection/port-scan.service';
import { ElasticsearchService } from 'src/elasticsearch/elasticsearch.service';
import { PcapIncomingPacket } from 'src/common/types/pcap.models';
import { PcapNetworkService } from './pcap.network.service';
import { FloodDetectionService } from 'src/detection/flood-detection.service';
import { DnsAmplificationDetectionService } from 'src/detection/dns-amplification.service';

@Injectable()
export class ReceiverService {
  constructor(
    private readonly pcapNetworkService: PcapNetworkService,
    private readonly portScanService: PortScanService,
    private readonly elasticSearchService: ElasticsearchService,
    private readonly floodDetectionService: FloodDetectionService,
    private readonly dnsAmplificationService: DnsAmplificationDetectionService,
  ) {}

  async handlePcapNetworkData(jsonMessage: PcapIncomingPacket) {
    const parsedPacket =
      this.pcapNetworkService.parseIncomingPacket(jsonMessage);

    this.portScanService.processPcapPacket(parsedPacket);
    this.floodDetectionService.detectFlood(parsedPacket);
    this.dnsAmplificationService.detect(parsedPacket);

    this.elasticSearchService.indexPacket(parsedPacket);
  }
}
